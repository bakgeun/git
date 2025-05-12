/**
 * 게시판 관리 페이지 스크립트
 */

// 게시판 관리 객체
const boardManager = {
    currentBoard: 'notice',
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    
    // 게시판 이름 매핑
    boardNames: {
        'notice': '공지사항',
        'column': '칼럼',
        'materials': '강의자료',
        'videos': '동영상 강의'
    },
    
    // 게시판별 필수 필드
    boardFields: {
        'notice': ['isImportant'],
        'column': ['author', 'category'],
        'materials': ['category', 'attachments'],
        'videos': ['videoUrl', 'duration']
    },
    
    /**
     * 게시판 전환
     */
    switchBoard: function(boardType) {
        this.currentBoard = boardType;
        this.currentPage = 1;
        this.lastDoc = null;
        this.filters = {};
        
        // 탭 활성화 상태 변경
        document.querySelectorAll('.board-tab').forEach(tab => {
            if (tab.dataset.board === boardType) {
                tab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
                tab.classList.remove('border-transparent', 'text-gray-500');
            } else {
                tab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
                tab.classList.add('border-transparent', 'text-gray-500');
            }
        });
        
        // 게시판 제목 변경
        document.getElementById('board-title').textContent = this.boardNames[boardType];
        
        // 검색 필터 초기화
        adminUtils.resetFilters();
        
        // 게시글 목록 로드
        this.loadPosts();
    },
    
    /**
     * 게시글 목록 로드
     */
    loadPosts: async function() {
        adminUtils.showLoadingOverlay(true);
        
        try {
            const collectionName = `board_${this.currentBoard}`;
            
            // 필터 옵션 설정
            const options = {
                orderBy: { field: 'createdAt', direction: 'desc' },
                pageSize: this.pageSize
            };
            
            // 필터 적용
            if (this.filters.status) {
                options.where = options.where || [];
                options.where.push({ field: 'status', operator: '==', value: this.filters.status });
            }
            
            // 검색어 필터
            let searchResults;
            if (this.filters.searchKeyword) {
                searchResults = await dbService.searchDocuments(collectionName, 'title', this.filters.searchKeyword, options);
            } else {
                searchResults = await dbService.getPaginatedDocuments(collectionName, options, this.currentPage > 1 ? this.lastDoc : null);
            }
            
            if (searchResults.success) {
                // 작성자 정보 추가 조회
                const postsWithAuthor = await Promise.all(searchResults.data.map(async (post) => {
                    if (post.authorId) {
                        const userDoc = await dbService.getDocument('users', post.authorId);
                        if (userDoc.success) {
                            post.authorName = userDoc.data.displayName || userDoc.data.email;
                            post.authorEmail = userDoc.data.email;
                        }
                    }
                    return post;
                }));
                
                // 테이블 업데이트
                this.updatePostTable(postsWithAuthor);
                
                // 페이지네이션 업데이트
                if (!this.filters.searchKeyword) {
                    this.lastDoc = searchResults.lastDoc;
                    
                    // 전체 게시글 수 계산
                    const totalCount = await dbService.countDocuments(collectionName, { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);
                    
                    adminUtils.createPagination('board-pagination', this.currentPage, totalPages, 'boardManager.changePage');
                }
            } else {
                console.error('게시글 목록 로드 실패:', searchResults.error);
                adminAuth.showNotification('게시글 목록을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('게시글 목록 로드 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 게시글 테이블 업데이트
     */
    updatePostTable: function(posts) {
        const columns = {
            title: { 
                label: '제목',
                formatter: (value, post) => {
                    let title = value;
                    if (post.isImportant) {
                        title = '<span class="text-red-600 font-bold">[중요]</span> ' + title;
                    }
                    return title;
                }
            },
            authorName: { 
                label: '작성자',
                formatter: (value) => value || '알 수 없음'
            },
            viewCount: { 
                label: '조회수',
                formatter: (value) => value || 0
            },
            createdAt: { 
                label: '작성일',
                formatter: (value) => value ? formatters.formatDate(value.toDate()) : '-'
            },
            status: { 
                label: '상태',
                formatter: (value) => {
                    const statusBadge = {
                        'published': '<span class="admin-badge admin-badge-success">게시</span>',
                        'draft': '<span class="admin-badge admin-badge-warning">임시저장</span>',
                        'hidden': '<span class="admin-badge admin-badge-danger">숨김</span>'
                    };
                    return statusBadge[value] || value;
                }
            }
        };
        
        const actions = [
            { label: '보기', type: 'info', handler: 'boardManager.viewPost' },
            { label: '수정', type: 'primary', handler: 'boardManager.editPost' },
            { label: '삭제', type: 'danger', handler: 'boardManager.deletePost' }
        ];
        
        adminUtils.createDataTable('board-table', posts, columns, { actions });
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadPosts();
    },
    
    /**
     * 게시글 추가 모달 표시
     */
    showAddPostModal: function() {
        const boardType = this.currentBoard;
        
        let extraFields = '';
        
        // 게시판별 추가 필드
        if (boardType === 'notice') {
            extraFields += `
                <div class="admin-form-group">
                    <label class="admin-form-label">
                        <input type="checkbox" name="isImportant" value="true">
                        중요 공지사항으로 표시
                    </label>
                </div>
            `;
        }
        
        if (boardType === 'column') {
            extraFields += `
                <div class="admin-form-group">
                    <label class="admin-form-label">저자 <span class="text-red-500">*</span></label>
                    <input type="text" name="author" class="admin-form-control" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">카테고리</label>
                    <input type="text" name="category" class="admin-form-control" placeholder="예: 건강, 운동, 영양">
                </div>
            `;
        }
        
        if (boardType === 'materials') {
            extraFields += `
                <div class="admin-form-group">
                    <label class="admin-form-label">카테고리</label>
                    <input type="text" name="category" class="admin-form-control" placeholder="예: 이론, 실습, 시험">
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">첨부파일</label>
                    <input type="file" name="attachments" class="admin-form-control" multiple>
                </div>
            `;
        }
        
        if (boardType === 'videos') {
            extraFields += `
                <div class="admin-form-group">
                    <label class="admin-form-label">동영상 URL <span class="text-red-500">*</span></label>
                    <input type="url" name="videoUrl" class="admin-form-control" placeholder="YouTube 또는 Vimeo URL" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">재생 시간</label>
                    <input type="text" name="duration" class="admin-form-control" placeholder="예: 15:30">
                </div>
            `;
        }
        
        const modalContent = `
            <form id="post-form" onsubmit="boardManager.handleAddPost(event)">
                <div class="admin-form-group">
                    <label class="admin-form-label">제목 <span class="text-red-500">*</span></label>
                    <input type="text" name="title" class="admin-form-control" required>
                </div>
                
                ${extraFields}
                
                <div class="admin-form-group">
                    <label class="admin-form-label">내용 <span class="text-red-500">*</span></label>
                    <textarea name="content" rows="8" class="admin-form-control" required></textarea>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">상태</label>
                    <select name="status" class="admin-form-control">
                        <option value="published">게시</option>
                        <option value="draft">임시저장</option>
                        <option value="hidden">숨김</option>
                    </select>
                </div>
            </form>
        `;
        
        adminUtils.showModal({
            title: `${this.boardNames[boardType]} 추가`,
            content: modalContent,
            buttons: [
                { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                { label: '저장', type: 'primary', handler: 'document.getElementById("post-form").submit()' }
            ]
        });
    },
    
    /**
     * 게시글 추가 처리
     */
    handleAddPost: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            const user = window.dhcFirebase.getCurrentUser();
            
            // 기본 게시글 데이터
            const postData = {
                title: formData.get('title'),
                content: formData.get('content'),
                status: formData.get('status'),
                authorId: user.uid,
                viewCount: 0,
                boardType: this.currentBoard
            };
            
            // 게시판별 추가 데이터
            if (this.currentBoard === 'notice') {
                postData.isImportant = formData.get('isImportant') === 'true';
            }
            
            if (this.currentBoard === 'column') {
                postData.author = formData.get('author');
                postData.category = formData.get('category') || '';
            }
            
            if (this.currentBoard === 'materials') {
                postData.category = formData.get('category') || '';
                // 파일 업로드 처리 (추가 구현 필요)
                const files = form.querySelector('input[name="attachments"]').files;
                if (files.length > 0) {
                    postData.attachments = [];
                    for (let file of files) {
                        // 파일 업로드 후 URL 저장
                        const uploadResult = await storageService.uploadFile(file, `materials/${Date.now()}_${file.name}`);
                        if (uploadResult.success) {
                            postData.attachments.push({
                                name: file.name,
                                url: uploadResult.url,
                                size: file.size
                            });
                        }
                    }
                }
            }
            
            if (this.currentBoard === 'videos') {
                postData.videoUrl = formData.get('videoUrl');
                postData.duration = formData.get('duration') || '';
            }
            
            // 게시글 저장
            const collectionName = `board_${this.currentBoard}`;
            const result = await dbService.addDocument(collectionName, postData);
            
            if (result.success) {
                adminAuth.showNotification('게시글이 추가되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadPosts();
            } else {
                adminAuth.showNotification('게시글 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('게시글 추가 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 게시글 상세 보기
     */
    viewPost: async function(postId) {
        try {
            const collectionName = `board_${this.currentBoard}`;
            const postDoc = await dbService.getDocument(collectionName, postId);
            
            if (!postDoc.success) {
                adminAuth.showNotification('게시글을 불러올 수 없습니다.', 'error');
                return;
            }
            
            const post = postDoc.data;
            
            let extraInfo = '';
            
            // 게시판별 추가 정보
            if (this.currentBoard === 'notice' && post.isImportant) {
                extraInfo += '<p class="text-red-600 font-bold mb-2">[중요 공지사항]</p>';
            }
            
            if (this.currentBoard === 'column') {
                extraInfo += `
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 class="font-medium text-gray-700">저자</h4>
                            <p>${post.author || '-'}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">카테고리</h4>
                            <p>${post.category || '-'}</p>
                        </div>
                    </div>
                `;
            }
            
            if (this.currentBoard === 'materials' && post.attachments?.length > 0) {
                extraInfo += `
                    <div class="mb-4">
                        <h4 class="font-medium text-gray-700 mb-2">첨부파일</h4>
                        <ul class="space-y-1">
                            ${post.attachments.map(file => `
                                <li>
                                    <a href="${file.url}" target="_blank" class="text-blue-600 hover:underline">
                                        ${file.name} (${formatters.formatFileSize(file.size)})
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (this.currentBoard === 'videos') {
                extraInfo += `
                    <div class="mb-4">
                        <h4 class="font-medium text-gray-700">동영상</h4>
                        <a href="${post.videoUrl}" target="_blank" class="text-blue-600 hover:underline">${post.videoUrl}</a>
                        ${post.duration ? `<p class="text-gray-600">재생시간: ${post.duration}</p>` : ''}
                    </div>
                `;
            }
            
            const modalContent = `
                <div class="space-y-4">
                    <div>
                        <h4 class="font-medium text-gray-700">제목</h4>
                        <p class="text-lg">${post.title}</p>
                    </div>
                    
                    ${extraInfo}
                    
                    <div>
                        <h4 class="font-medium text-gray-700">내용</h4>
                        <div class="whitespace-pre-wrap bg-gray-50 p-4 rounded">${post.content}</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">조회수</h4>
                            <p>${post.viewCount || 0}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">상태</h4>
                            <p>${this.getStatusBadge(post.status)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">작성일</h4>
                            <p>${formatters.formatDateTime(post.createdAt?.toDate())}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">수정일</h4>
                            <p>${post.updatedAt ? formatters.formatDateTime(post.updatedAt.toDate()) : '-'}</p>
                        </div>
                    </div>
                </div>
            `;
            
            adminUtils.showModal({
                title: '게시글 상세',
                content: modalContent,
                buttons: [
                    { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                ]
            });
        } catch (error) {
            console.error('게시글 상세 조회 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시글 수정
     */
    editPost: async function(postId) {
        try {
            const collectionName = `board_${this.currentBoard}`;
            const postDoc = await dbService.getDocument(collectionName, postId);
            
            if (!postDoc.success) {
                adminAuth.showNotification('게시글을 불러올 수 없습니다.', 'error');
                return;
            }
            
            const post = postDoc.data;
            const boardType = this.currentBoard;
            
            let extraFields = '';
            
            // 게시판별 추가 필드
            if (boardType === 'notice') {
                extraFields += `
                    <div class="admin-form-group">
                        <label class="admin-form-label">
                            <input type="checkbox" name="isImportant" value="true" ${post.isImportant ? 'checked' : ''}>
                            중요 공지사항으로 표시
                        </label>
                    </div>
                `;
            }
            
            if (boardType === 'column') {
                extraFields += `
                    <div class="admin-form-group">
                        <label class="admin-form-label">저자 <span class="text-red-500">*</span></label>
                        <input type="text" name="author" class="admin-form-control" value="${post.author || ''}" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">카테고리</label>
                        <input type="text" name="category" class="admin-form-control" value="${post.category || ''}" placeholder="예: 건강, 운동, 영양">
                    </div>
                `;
            }
            
            if (boardType === 'materials') {
                extraFields += `
                    <div class="admin-form-group">
                        <label class="admin-form-label">카테고리</label>
                        <input type="text" name="category" class="admin-form-control" value="${post.category || ''}" placeholder="예: 이론, 실습, 시험">
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">첨부파일</label>
                        <input type="file" name="attachments" class="admin-form-control" multiple>
                        ${post.attachments?.length > 0 ? `
                            <div class="mt-2">
                                <p class="text-sm text-gray-600">기존 첨부파일:</p>
                                <ul class="text-sm">
                                    ${post.attachments.map(file => `<li>${file.name}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            if (boardType === 'videos') {
                extraFields += `
                    <div class="admin-form-group">
                        <label class="admin-form-label">동영상 URL <span class="text-red-500">*</span></label>
                        <input type="url" name="videoUrl" class="admin-form-control" value="${post.videoUrl || ''}" placeholder="YouTube 또는 Vimeo URL" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">재생 시간</label>
                        <input type="text" name="duration" class="admin-form-control" value="${post.duration || ''}" placeholder="예: 15:30">
                    </div>
                `;
            }
            
            const modalContent = `
                <form id="edit-post-form" onsubmit="boardManager.handleEditPost(event, '${postId}')">
                    <div class="admin-form-group">
                        <label class="admin-form-label">제목 <span class="text-red-500">*</span></label>
                        <input type="text" name="title" class="admin-form-control" value="${post.title}" required>
                    </div>
                    
                    ${extraFields}
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">내용 <span class="text-red-500">*</span></label>
                        <textarea name="content" rows="8" class="admin-form-control" required>${post.content}</textarea>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">상태</label>
                        <select name="status" class="admin-form-control">
                            <option value="published" ${post.status === 'published' ? 'selected' : ''}>게시</option>
                            <option value="draft" ${post.status === 'draft' ? 'selected' : ''}>임시저장</option>
                            <option value="hidden" ${post.status === 'hidden' ? 'selected' : ''}>숨김</option>
                        </select>
                    </div>
                </form>
            `;
            
            adminUtils.showModal({
                title: '게시글 수정',
                content: modalContent,
                buttons: [
                    { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                    { label: '저장', type: 'primary', handler: 'document.getElementById("edit-post-form").submit()' }
                ]
            });
        } catch (error) {
            console.error('게시글 수정 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시글 수정 처리
     */
    handleEditPost: async function(event, postId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            const collectionName = `board_${this.currentBoard}`;
            
            // 기본 업데이트 데이터
            const updateData = {
                title: formData.get('title'),
                content: formData.get('content'),
                status: formData.get('status')
            };
            
            // 게시판별 추가 데이터
            if (this.currentBoard === 'notice') {
                updateData.isImportant = formData.get('isImportant') === 'true';
            }
            
            if (this.currentBoard === 'column') {
                updateData.author = formData.get('author');
                updateData.category = formData.get('category') || '';
            }
            
            if (this.currentBoard === 'materials') {
                updateData.category = formData.get('category') || '';
                // 새 파일이 업로드된 경우에만 처리
                const files = form.querySelector('input[name="attachments"]').files;
                if (files.length > 0) {
                    updateData.attachments = [];
                    for (let file of files) {
                        const uploadResult = await storageService.uploadFile(file, `materials/${Date.now()}_${file.name}`);
                        if (uploadResult.success) {
                            updateData.attachments.push({
                                name: file.name,
                                url: uploadResult.url,
                                size: file.size
                            });
                        }
                    }
                }
            }
            
            if (this.currentBoard === 'videos') {
                updateData.videoUrl = formData.get('videoUrl');
                updateData.duration = formData.get('duration') || '';
            }
            
            const result = await dbService.updateDocument(collectionName, postId, updateData);
            
            if (result.success) {
                adminAuth.showNotification('게시글이 수정되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadPosts();
            } else {
                adminAuth.showNotification('게시글 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('게시글 수정 처리 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 게시글 삭제
     */
    deletePost: function(postId) {
        adminUtils.confirmDialog(
            '정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            () => this.handleDeletePost(postId)
        );
    },
    
    /**
     * 게시글 삭제 처리
     */
    handleDeletePost: async function(postId) {
        adminUtils.showLoadingOverlay(true);
        
        try {
            const collectionName = `board_${this.currentBoard}`;
            
            // 첨부파일이 있는 경우 스토리지에서도 삭제
            if (this.currentBoard === 'materials') {
                const postDoc = await dbService.getDocument(collectionName, postId);
                if (postDoc.success && postDoc.data.attachments?.length > 0) {
                    // 첨부파일 삭제
                    for (let file of postDoc.data.attachments) {
                        try {
                            await storageService.deleteFile(file.url);
                        } catch (err) {
                            console.error('파일 삭제 오류:', err);
                        }
                    }
                }
            }
            
            const result = await dbService.deleteDocument(collectionName, postId);
            
            if (result.success) {
                adminAuth.showNotification('게시글이 삭제되었습니다.', 'success');
                this.loadPosts();
            } else {
                adminAuth.showNotification('게시글 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 검색 필터 적용
     */
    applyFilters: function() {
        this.filters = {
            searchKeyword: document.getElementById('search-keyword')?.value || '',
            status: document.getElementById('post-status')?.value || ''
        };
        
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadPosts();
    },
    
    /**
     * 상태 뱃지 가져오기
     */
    getStatusBadge: function(status) {
        const statusBadge = {
            'published': '<span class="admin-badge admin-badge-success">게시</span>',
            'draft': '<span class="admin-badge admin-badge-warning">임시저장</span>',
            'hidden': '<span class="admin-badge admin-badge-danger">숨김</span>'
        };
        return statusBadge[status] || status;
    }
};

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', async function() {
    // Firebase 초기화 대기
    await window.dhcFirebase.initialize();
    
    // 관리자 권한 확인
    const hasAccess = await window.adminAuth.checkAdminAccess();
    if (!hasAccess) {
        return; // 권한이 없으면 이미 리디렉션됨
    }
    
    // 관리자 정보 표시
    await window.adminAuth.displayAdminInfo();
    
    // 검색 필터 설정
    const filterOptions = {
        searchField: {
            label: '검색',
            placeholder: '제목으로 검색'
        },
        selectFilters: [
            {
                id: 'post-status',
                label: '상태',
                options: [
                    { value: 'published', label: '게시' },
                    { value: 'draft', label: '임시저장' },
                    { value: 'hidden', label: '숨김' }
                ]
            }
        ]
    };
    
    adminUtils.createSearchFilter('board-filter-container', filterOptions, 'boardManager.applyFilters');
    
    // 기본 게시판(공지사항) 로드
    boardManager.loadPosts();
});