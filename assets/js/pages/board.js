/**
 * board.js
 * 게시판 관련 공통 기능
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // 게시판 타입별 설정
    const boardConfig = {
        notice: {
            collection: 'notices',
            name: '공지사항',
            categories: {
                notice: '일반공지',
                education: '교육안내',
                exam: '시험안내',
                event: '행사안내'
            },
            permissions: {
                read: ['all'],
                write: ['admin'],
                edit: ['admin'],
                delete: ['admin']
            }
        },
        column: {
            collection: 'columns',
            name: '칼럼',
            categories: {
                health: '건강정보',
                exercise: '운동방법',
                nutrition: '영양정보',
                rehabilitation: '재활정보'
            },
            permissions: {
                read: ['all'],
                write: ['admin', 'instructor'],
                edit: ['admin', 'author'],
                delete: ['admin']
            }
        },
        materials: {
            collection: 'materials',
            name: '강의자료',
            categories: {
                lecture: '강의자료',
                reference: '참고자료',
                exercise: '실습자료',
                exam: '시험자료'
            },
            permissions: {
                read: ['user', 'instructor', 'admin'],
                write: ['instructor', 'admin'],
                edit: ['admin', 'author'],
                delete: ['admin']
            }
        },
        videos: {
            collection: 'videos',
            name: '동영상 강의',
            categories: {
                theory: '이론강의',
                practice: '실습강의',
                special: '특강',
                review: '복습자료'
            },
            permissions: {
                read: ['user', 'instructor', 'admin'],
                write: ['instructor', 'admin'],
                edit: ['admin', 'author'],
                delete: ['admin']
            }
        }
    };

    // 페이지 유형 확인
    function getBoardType() {
        const path = window.location.pathname;
        if (path.includes('/notice/')) return 'notice';
        if (path.includes('/column/')) return 'column';
        if (path.includes('/materials/')) return 'materials';
        if (path.includes('/videos/')) return 'videos';
        return null;
    }

    // 페이지가 목록인지 상세보기인지 확인
    function isListPage() {
        return window.location.pathname.endsWith('index.html');
    }

    // 권한 확인
    function hasPermission(action, boardType, userId = null, authorId = null) {
        const user = authService.getCurrentUser();
        const config = boardConfig[boardType];
        if (!config) return false;

        const permissions = config.permissions[action];
        if (!permissions) return false;

        // 모든 사용자 허용
        if (permissions.includes('all')) return true;

        // 로그인하지 않은 사용자
        if (!user) return false;

        // 특정 역할 확인
        if (permissions.includes(user.role)) return true;

        // 작성자 권한 확인
        if (permissions.includes('author') && userId && authorId && userId === authorId) return true;

        return false;
    }

    // 카테고리 텍스트 가져오기
    function getCategoryText(boardType, categoryKey) {
        const config = boardConfig[boardType];
        return config && config.categories[categoryKey] ? config.categories[categoryKey] : categoryKey;
    }

    // 목록 페이지 초기화
    function initListPage() {
        const boardType = getBoardType();
        if (!boardType) return;

        let currentPage = 1;
        let lastDoc = null;
        let hasMore = true;
        let searchQuery = '';
        let categoryFilter = '';

        // 게시글 목록 가져오기
        async function loadPosts(reset = false) {
            if (reset) {
                currentPage = 1;
                lastDoc = null;
                hasMore = true;
            }

            const collection = boardConfig[boardType].collection;
            const options = {
                orderBy: { field: 'createdAt', direction: 'desc' },
                pageSize: 10
            };

            // 카테고리 필터
            if (categoryFilter) {
                options.where = { field: 'category', operator: '==', value: categoryFilter };
            }

            try {
                let result;
                if (searchQuery) {
                    // 검색 쿼리가 있는 경우
                    result = await dbService.searchDocuments(collection, 'title', searchQuery, options);
                } else {
                    // 일반 페이지네이션
                    result = await dbService.getPaginatedDocuments(collection, options, lastDoc);
                }

                if (result.success) {
                    if (reset) {
                        displayPosts(result.data, true);
                    } else {
                        displayPosts(result.data, false);
                    }
                    
                    lastDoc = result.lastDoc;
                    hasMore = result.hasMore;
                    updatePagination();
                } else {
                    console.error('게시글 로드 실패:', result.error);
                }
            } catch (error) {
                console.error('게시글 로드 중 오류:', error);
            }
        }

        // 게시글 표시
        function displayPosts(posts, reset = false) {
            const tbody = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-list`);
            if (!tbody) return;

            if (reset) {
                tbody.innerHTML = '';
            }

            if (posts.length === 0 && reset) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                            등록된 게시글이 없습니다.
                        </td>
                    </tr>
                `;
                return;
            }

            posts.forEach((post, index) => {
                const number = (currentPage - 1) * 10 + index + 1;
                const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : '';
                const categoryText = getCategoryText(boardType, post.category);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${number}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            ${categoryText}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <a href="view.html?id=${post.id}" class="text-gray-900 hover:text-blue-600">
                            ${post.title}
                            ${post.attachments && post.attachments.length > 0 ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>' : ''}
                        </a>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">${post.authorName || '관리자'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">${post.views || 0}</td>
                `;
                tbody.appendChild(row);
            });
        }

        // 페이지네이션 업데이트
        function updatePagination() {
            const pagination = document.getElementById('pagination');
            if (!pagination) return;

            pagination.innerHTML = '';

            // 이전 페이지 버튼
            if (currentPage > 1) {
                const prevButton = document.createElement('button');
                prevButton.className = 'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50';
                prevButton.innerHTML = '이전';
                prevButton.onclick = () => {
                    currentPage--;
                    loadPosts();
                };
                pagination.appendChild(prevButton);
            }

            // 페이지 번호
            const pageButton = document.createElement('span');
            pageButton.className = 'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700';
            pageButton.textContent = `${currentPage}`;
            pagination.appendChild(pageButton);

            // 다음 페이지 버튼
            if (hasMore) {
                const nextButton = document.createElement('button');
                nextButton.className = 'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50';
                nextButton.innerHTML = '다음';
                nextButton.onclick = () => {
                    currentPage++;
                    loadPosts();
                };
                pagination.appendChild(nextButton);
            }
        }

        // 검색 기능
        function setupSearch() {
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');
            const categorySelect = document.getElementById('category-filter');

            if (searchButton) {
                searchButton.addEventListener('click', () => {
                    searchQuery = searchInput ? searchInput.value.trim() : '';
                    categoryFilter = categorySelect ? categorySelect.value : '';
                    loadPosts(true);
                });
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        searchQuery = searchInput.value.trim();
                        categoryFilter = categorySelect ? categorySelect.value : '';
                        loadPosts(true);
                    }
                });
            }

            if (categorySelect) {
                categorySelect.addEventListener('change', () => {
                    categoryFilter = categorySelect.value;
                    loadPosts(true);
                });
            }
        }

        // 글쓰기 버튼 권한 확인
        function checkWritePermission() {
            const writeButton = document.getElementById('write-button');
            if (writeButton && hasPermission('write', boardType)) {
                writeButton.classList.remove('hidden');
                writeButton.addEventListener('click', () => {
                    window.location.href = 'write.html';
                });
            }
        }

        // 총 게시글 수 업데이트
        async function updateTotalCount() {
            const collection = boardConfig[boardType].collection;
            const options = categoryFilter ? { where: { field: 'category', operator: '==', value: categoryFilter } } : {};
            
            try {
                const result = await dbService.countDocuments(collection, options);
                if (result.success) {
                    const totalCount = document.getElementById('total-count');
                    if (totalCount) {
                        totalCount.textContent = result.count;
                    }
                }
            } catch (error) {
                console.error('게시글 수 조회 오류:', error);
            }
        }

        // 초기화
        setupSearch();
        checkWritePermission();
        loadPosts(true);
        updateTotalCount();
    }

    // 상세보기 페이지 초기화
    function initViewPage() {
        const boardType = getBoardType();
        if (!boardType) return;

        // URL에서 게시글 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        
        if (!postId) {
            alert('잘못된 접근입니다.');
            window.location.href = 'index.html';
            return;
        }

        // 게시글 정보 로드
        async function loadPost() {
            const collection = boardConfig[boardType].collection;
            
            try {
                const result = await dbService.getDocument(collection, postId);
                
                if (result.success) {
                    displayPost(result.data);
                    updateViews(postId);
                    loadPrevNextPost(postId);
                } else {
                    alert('게시글을 찾을 수 없습니다.');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error('게시글 로드 오류:', error);
                alert('게시글 로드 중 오류가 발생했습니다.');
            }
        }

        // 게시글 표시
        function displayPost(post) {
            // 제목
            const titleElement = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-title`);
            if (titleElement) titleElement.textContent = post.title;
            
            // 브레드크럼브
            const breadcrumbTitle = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-title-breadcrumb`);
            if (breadcrumbTitle) breadcrumbTitle.textContent = post.title;
            
            // 카테고리
            const categoryElement = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-category`);
            if (categoryElement) categoryElement.textContent = getCategoryText(boardType, post.category);
            
            // 작성일
            const dateElement = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-date`);
            if (dateElement && post.createdAt) {
                dateElement.textContent = new Date(post.createdAt.seconds * 1000).toLocaleDateString();
            }
            
            // 작성자
            const authorElement = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-author`);
            if (authorElement) authorElement.textContent = post.authorName || '관리자';
            
            // 조회수
            const viewsElement = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-views`);
            if (viewsElement) viewsElement.textContent = post.views || 0;
            
            // 내용
            const contentElement = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-content`);
            if (contentElement) {
                // XSS 방지를 위한 기본적인 처리
                contentElement.innerHTML = post.content.replace(/\n/g, '<br>');
            }
            
            // 첨부파일
            if (post.attachments && post.attachments.length > 0) {
                displayAttachments(post.attachments);
            }
            
            // 관리자 버튼 표시
            checkAdminButtons(post);
        }

        // 조회수 증가
        async function updateViews(postId) {
            const collection = boardConfig[boardType].collection;
            
            try {
                const result = await dbService.getDocument(collection, postId);
                if (result.success) {
                    const currentViews = result.data.views || 0;
                    await dbService.updateDocument(collection, postId, {
                        views: currentViews + 1
                    });
                }
            } catch (error) {
                console.error('조회수 업데이트 오류:', error);
            }
        }

        // 첨부파일 표시
        function displayAttachments(attachments) {
            const attachmentsSection = document.getElementById(`${boardType === 'notice' ? 'notice' : 'post'}-attachments`);
            const attachmentList = document.getElementById('attachment-list');
            
            if (attachmentsSection && attachmentList) {
                attachmentsSection.classList.remove('hidden');
                attachmentList.innerHTML = '';
                
                attachments.forEach(attachment => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <a href="${attachment.url}" target="_blank" class="flex items-center text-blue-600 hover:text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            ${attachment.name} (${formatFileSize(attachment.size)})
                        </a>
                    `;
                    attachmentList.appendChild(li);
                });
            }
        }

        // 파일 크기 포맷
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // 관리자 버튼 권한 확인
        function checkAdminButtons(post) {
            const adminButtons = document.getElementById('admin-buttons');
            const user = authService.getCurrentUser();
            
            if (adminButtons && user) {
                if (hasPermission('edit', boardType, user.id, post.authorId)) {
                    const editButton = document.getElementById('edit-button');
                    if (editButton) {
                        editButton.addEventListener('click', () => {
                            window.location.href = `write.html?id=${postId}`;
                        });
                    }
                }
                
                if (hasPermission('delete', boardType, user.id, post.authorId)) {
                    const deleteButton = document.getElementById('delete-button');
                    if (deleteButton) {
                        deleteButton.addEventListener('click', () => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                                deletePost(postId);
                            }
                        });
                    }
                }
                
                if (hasPermission('edit', boardType, user.id, post.authorId) || 
                    hasPermission('delete', boardType, user.id, post.authorId)) {
                    adminButtons.classList.remove('hidden');
                }
            }
        }

        // 게시글 삭제
        async function deletePost(postId) {
            const collection = boardConfig[boardType].collection;
            
            try {
                const result = await dbService.deleteDocument(collection, postId);
                
                if (result.success) {
                    alert('게시글이 삭제되었습니다.');
                    window.location.href = 'index.html';
                } else {
                    alert('게시글 삭제 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('게시글 삭제 오류:', error);
                alert('게시글 삭제 중 오류가 발생했습니다.');
            }
        }

        // 이전글/다음글 로드
        async function loadPrevNextPost(currentPostId) {
            const collection = boardConfig[boardType].collection;
            
            try {
                // 현재 게시글 정보 가져오기
                const currentResult = await dbService.getDocument(collection, currentPostId);
                if (!currentResult.success) return;
                
                const currentPost = currentResult.data;
                const currentDate = currentPost.createdAt;
                
                // 이전글 (더 최근 게시글)
                const prevResult = await dbService.getDocuments(collection, {
                    where: { field: 'createdAt', operator: '>', value: currentDate },
                    orderBy: { field: 'createdAt', direction: 'asc' },
                    limit: 1
                });
                
                if (prevResult.success && prevResult.data.length > 0) {
                    displayPrevNextPost('prev', prevResult.data[0]);
                }
                
                // 다음글 (더 오래된 게시글)
                const nextResult = await dbService.getDocuments(collection, {
                    where: { field: 'createdAt', operator: '<', value: currentDate },
                    orderBy: { field: 'createdAt', direction: 'desc' },
                    limit: 1
                });
                
                if (nextResult.success && nextResult.data.length > 0) {
                    displayPrevNextPost('next', nextResult.data[0]);
                }
            } catch (error) {
                console.error('이전/다음 게시글 로드 오류:', error);
            }
        }

        // 이전글/다음글 표시
        function displayPrevNextPost(type, post) {
            const container = document.getElementById(`${type}-${boardType === 'notice' ? 'notice' : 'post'}`);
            if (container) {
                container.classList.remove('hidden');
                const link = container.querySelector('a');
                if (link) {
                    link.href = `view.html?id=${post.id}`;
                    link.querySelector('.flex-1').textContent = post.title;
                }
            }
        }

        // 초기화
        loadPost();
    }

    // 페이지 초기화
    function init() {
        const boardType = getBoardType();
        if (!boardType) return;

        if (isListPage()) {
            initListPage();
        } else {
            initViewPage();
        }
    }

    // DOMContentLoaded 이벤트 리스너
    document.addEventListener('DOMContentLoaded', init);

    // 전역 객체에 필요한 함수 노출
    window.boardService = {
        getBoardType,
        hasPermission,
        getCategoryText
    };
})();