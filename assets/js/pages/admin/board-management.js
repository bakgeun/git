/**
 * 게시판 관리 페이지 스크립트
 */

// 게시판 관리 객체
window.boardManager = {
    currentPage: 1,
    pageSize: 10,
    currentBoardType: 'notice', // 기본값: 공지사항
    
    /**
     * 초기화
     */
    init: async function() {
        try {
            console.log('게시판 관리자 초기화 시작');
            
            // 이벤트 리스너 등록
            this.registerEventListeners();
            
            // 게시판 탭 클릭 이벤트 처리
            const boardTabs = document.querySelectorAll('.board-tab');
            if (boardTabs.length > 0) {
                // 첫 번째 탭을 기본으로 활성화
                this.switchBoard(boardTabs[0].getAttribute('data-board') || 'notice');
            } else {
                // 기본 게시판 유형으로 데이터 로드
                await this.loadBoardData();
            }
            
            console.log('게시판 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('게시판 관리자 초기화 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
            }
            return false;
        }
    },
    
    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners: function() {
        console.log('이벤트 리스너 등록 시작');
        
        // 게시판 탭 클릭 이벤트
        const boardTabs = document.querySelectorAll('.board-tab');
        boardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const boardType = tab.getAttribute('data-board');
                if (boardType) {
                    this.switchBoard(boardType);
                }
            });
        });
        
        // 검색 필터 설정
        this.setupSearchFilter();
        
        // 검색 버튼
        const searchBtn = document.getElementById('search-button');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.search.bind(this));
        }
        
        // 초기화 버튼
        const resetBtn = document.getElementById('reset-button');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetSearch.bind(this));
        }
        
        // 게시글 작성 버튼
        const writeBtn = document.querySelector('button[onclick="boardManager.showAddPostModal()"]');
        if (writeBtn) {
            // onclick 속성 대신 이벤트 리스너 등록
            writeBtn.removeAttribute('onclick');
            writeBtn.addEventListener('click', this.showAddPostModal.bind(this));
        }
        
        // 검색어 입력 시 엔터키 이벤트
        const searchInput = document.getElementById('search-keyword');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search();
                }
            });
        }
        
        // 모달 관련 이벤트 리스너
        const closeModalBtn = document.querySelector('button[onclick="boardManager.closePostModal()"]');
        if (closeModalBtn) {
            // onclick 속성 대신 이벤트 리스너 등록
            closeModalBtn.removeAttribute('onclick');
            closeModalBtn.addEventListener('click', this.closePostModal.bind(this));
        }
        
        const cancelBtn = document.querySelector('button[onclick="boardManager.closePostModal()"]');
        if (cancelBtn && cancelBtn !== closeModalBtn) {
            // onclick 속성 대신 이벤트 리스너 등록
            cancelBtn.removeAttribute('onclick');
            cancelBtn.addEventListener('click', this.closePostModal.bind(this));
        }
        
        // 폼 제출 이벤트
        const postForm = document.getElementById('post-form');
        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const postId = postForm.dataset.postId;
                if (postId) {
                    this.handleUpdatePost(e, postId);
                } else {
                    this.handleCreatePost(e);
                }
            });
        }
        
        console.log('이벤트 리스너 등록 완료');
    },
    
    /**
     * 검색 필터 설정
     */
    setupSearchFilter: function() {
        const filterContainer = document.getElementById('board-filter-container');
        if (!filterContainer) return;
        
        filterContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="search-type" class="block text-sm font-medium text-gray-700 mb-1">검색 조건</label>
                        <select id="search-type" class="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            <option value="author">작성자</option>
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label for="search-keyword" class="block text-sm font-medium text-gray-700 mb-1">검색어</label>
                        <input type="text" id="search-keyword" placeholder="검색어를 입력하세요"
                            class="w-full border border-gray-300 rounded-md px-3 py-2">
                    </div>
                </div>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="search-button" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        검색
                    </button>
                    <button id="reset-button" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                        초기화
                    </button>
                </div>
            </div>
        `;
        
        // 새로 추가된 버튼들에 이벤트 리스너 등록
        const searchBtn = document.getElementById('search-button');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.search.bind(this));
        }
        
        const resetBtn = document.getElementById('reset-button');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetSearch.bind(this));
        }
    },
    
    /**
     * 게시판 유형 전환
     */
    switchBoard: function(boardType) {
        // 이미 선택된 유형이면 무시
        if (this.currentBoardType === boardType) return;
        
        console.log('게시판 유형 전환:', boardType);
        
        // 탭 상태 업데이트
        const tabs = document.querySelectorAll('.board-tab');
        tabs.forEach(tab => {
            const tabType = tab.getAttribute('data-board');
            if (tabType === boardType) {
                tab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
                tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            } else {
                tab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
                tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
        });
        
        // 타이틀 업데이트
        const boardTypeTitle = document.getElementById('board-title');
        if (boardTypeTitle) {
            boardTypeTitle.textContent = this.getBoardTypeName(boardType);
        }
        
        // 현재 게시판 유형 업데이트
        this.currentBoardType = boardType;
        this.currentPage = 1;
        
        // 게시판 데이터 로드
        this.loadBoardData();
    },
    
    // 기존 switchBoardType 함수는 switchBoard 함수로 대체
    switchBoardType: function(boardType) {
        this.switchBoard(boardType);
    },
    
    /**
     * 게시판 데이터 로드
     */
    loadBoardData: async function() {
        console.log('게시판 데이터 로드 시작:', this.currentBoardType);
        
        try {
            // 로딩 상태 표시
            const tableBody = document.querySelector('#board-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4 text-gray-500">데이터를 불러오는 중입니다...</td>
                    </tr>
                `;
            }
            
            // 검색 조건 가져오기
            const searchType = document.getElementById('search-type')?.value || 'title';
            const searchKeyword = document.getElementById('search-keyword')?.value || '';
            
            let posts = [];
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                try {
                    // 게시판 컬렉션 이름 (board_notice, board_column, board_material, board_video)
                    const collectionName = `board_${this.currentBoardType}`;
                    
                    // 조회 옵션
                    const options = {
                        orderBy: { field: 'createdAt', direction: 'desc' },
                        pageSize: this.pageSize
                    };
                    
                    // 검색 조건 적용
                    if (searchKeyword) {
                        const result = await window.dbService.searchDocuments(
                            collectionName,
                            searchType,
                            searchKeyword,
                            options
                        );
                        
                        if (result.success) {
                            posts = result.data;
                        }
                    } else {
                        // 페이지네이션 적용
                        const result = await window.dbService.getPaginatedDocuments(
                            collectionName,
                            options,
                            this.currentPage > 1 ? this.lastDoc : null
                        );
                        
                        if (result.success) {
                            posts = result.data;
                            this.lastDoc = result.lastDoc;
                            
                            // 전체 문서 수 가져오기
                            const countResult = await window.dbService.countDocuments(collectionName);
                            if (countResult.success) {
                                const totalPages = Math.ceil(countResult.count / this.pageSize);
                                this.updatePagination(totalPages);
                            }
                        }
                    }
                } catch (error) {
                    console.error('게시판 데이터 조회 오류:', error);
                    window.adminAuth?.showNotification('게시판 데이터 조회 중 오류가 발생했습니다.', 'error');
                }
            } else {
                // 테스트 데이터
                posts = this.getMockPosts();
                
                // 테스트 페이지네이션
                this.updatePagination(3);
            }
            
            // 게시글 목록 업데이트
            this.updateBoardList(posts);
            
        } catch (error) {
            console.error('게시판 데이터 로드 오류:', error);
            
            const tableBody = document.querySelector('#board-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-4 text-center text-red-500">데이터 로드 중 오류가 발생했습니다.</td>
                    </tr>
                `;
            }
        }
    },
    
    /**
     * 게시글 목록 업데이트
     */
    updateBoardList: function(posts) {
        const tableBody = document.querySelector('#board-table tbody');
        if (!tableBody) return;
        
        if (!posts || posts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-4 text-center text-gray-500">등록된 게시글이 없습니다.</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        const startNumber = (this.currentPage - 1) * this.pageSize + 1;
        
        posts.forEach((post, index) => {
            // 날짜 포맷팅
            const createdAt = post.createdAt ? 
                (typeof post.createdAt.toDate === 'function' ? 
                    this.formatDate(post.createdAt.toDate()) : 
                    post.createdAt) : 
                '-';
                
            const viewCount = post.viewCount || 0;
            
            html += `
                <tr>
                    <td class="py-3 px-4">
                        <a href="#" onclick="boardManager.viewPost('${post.id}')" class="text-indigo-600 hover:text-indigo-900">
                            ${post.title}
                        </a>
                    </td>
                    <td class="py-3 px-4 text-center">${post.author || '관리자'}</td>
                    <td class="py-3 px-4 text-center">${viewCount}</td>
                    <td class="py-3 px-4 text-center">${createdAt}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            활성
                        </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                        <div class="flex justify-center space-x-2">
                            <button onclick="boardManager.editPost('${post.id}')" class="text-indigo-600 hover:text-indigo-900">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button onclick="boardManager.deletePost('${post.id}')" class="text-red-600 hover:text-red-900">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    },
    
    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function(totalPages) {
        const paginationContainer = document.getElementById('board-pagination');
        if (!paginationContainer) return;
        
        let html = '';
        
        if (totalPages > 1) {
            html = '<div class="flex justify-center space-x-1">';
            
            // 이전 페이지 버튼
            html += `
                <button onclick="boardManager.changePage(${this.currentPage - 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                    이전
                </button>
            `;
            
            // 페이지 번호
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button onclick="boardManager.changePage(${i})" 
                        class="px-4 py-2 border rounded-md text-sm 
                        ${this.currentPage === i ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'}">
                        ${i}
                    </button>
                `;
            }
            
            // 다음 페이지 버튼
            html += `
                <button onclick="boardManager.changePage(${this.currentPage + 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                    다음
                </button>
            `;
            
            html += '</div>';
        }
        
        paginationContainer.innerHTML = html;
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        
        this.currentPage = page;
        this.loadBoardData();
    },
    
    /**
     * 검색
     */
    search: function() {
        console.log('게시글 검색 실행');
        
        this.currentPage = 1;
        this.loadBoardData();
    },
    
    /**
     * 검색 초기화
     */
    resetSearch: function() {
        console.log('검색 초기화');
        
        const searchType = document.getElementById('search-type');
        if (searchType) searchType.value = 'title';
        
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) searchKeyword.value = '';
        
        this.currentPage = 1;
        this.loadBoardData();
    },
    
    /**
     * 게시글 작성 모달 표시
     */
    showAddPostModal: function() {
        console.log('게시글 작성 모달 표시');
        
        const modal = document.getElementById('post-modal');
        const form = document.getElementById('post-form');
        const modalTitle = document.getElementById('modal-title');
        
        if (!modal || !form) {
            console.error('모달 또는 폼을 찾을 수 없습니다.');
            return;
        }
        
        // 모달 초기화
        form.reset();
        form.removeAttribute('data-post-id');
        
        // 모달 타이틀 설정
        if (modalTitle) {
            modalTitle.textContent = '게시글 작성';
        }
        
        // 모달 표시
        modal.classList.remove('hidden');
    },
    
    // 기존 showWriteModal 함수는 showAddPostModal 함수로 대체
    showWriteModal: function() {
        this.showAddPostModal();
    },
    
    /**
     * 게시글 모달 닫기
     */
    closePostModal: function() {
        const modal = document.getElementById('post-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    /**
     * 게시글 작성 처리
     */
    handleCreatePost: async function(event) {
        event.preventDefault();
        
        try {
            // 폼 데이터 가져오기
            const form = event.target;
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            
            // 유효성 검사
            if (!title) {
                window.adminAuth?.showNotification('제목을 입력해주세요.', 'error');
                return;
            }
            
            if (!content) {
                window.adminAuth?.showNotification('내용을 입력해주세요.', 'error');
                return;
            }
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                // 게시판 컬렉션 이름
                const collectionName = `board_${this.currentBoardType}`;
                
                // 게시글 데이터
                const postData = {
                    title: title,
                    content: content,
                    author: '관리자',
                    viewCount: 0,
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };
                
                try {
                    const result = await window.dbService.addDocument(collectionName, postData);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('게시글이 등록되었습니다.', 'success');
                        this.closePostModal();
                        this.loadBoardData();
                    } else {
                        window.adminAuth?.showNotification('게시글 등록에 실패했습니다.', 'error');
                    }
                } catch (error) {
                    console.error('게시글 등록 오류:', error);
                    window.adminAuth?.showNotification('게시글 등록 중 오류가 발생했습니다.', 'error');
                }
            } else {
                // 테스트 환경
                console.log('게시글 등록 테스트:', { boardType: this.currentBoardType, title, content });
                window.adminAuth?.showNotification('게시글이 등록되었습니다.', 'success');
                this.closePostModal();
                this.loadBoardData();
            }
        } catch (error) {
            console.error('게시글 등록 처리 오류:', error);
            window.adminAuth?.showNotification('게시글 등록 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시글 보기
     */
    viewPost: async function(postId) {
        console.log('게시글 보기:', postId);
        
        try {
            let post = null;
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                // 게시판 컬렉션 이름
                const collectionName = `board_${this.currentBoardType}`;
                
                // 게시글 조회
                const result = await window.dbService.getDocument(collectionName, postId);
                
                if (result.success) {
                    post = result.data;
                } else {
                    window.adminAuth?.showNotification('게시글을 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                post = this.getMockPostById(postId);
                
                if (!post) {
                    alert('게시글을 찾을 수 없습니다.');
                    return;
                }
            }
            
            // 내용 표시 (모달 또는 새 페이지)
            if (window.adminUtils?.showModal) {
                // 모달로 표시
                window.adminUtils.showModal({
                    title: post.title,
                    content: `
                        <div class="space-y-4">
                            <div class="flex justify-between text-sm text-gray-500">
                                <div>작성자: ${post.author || '관리자'}</div>
                                <div>작성일: ${this.formatDate(post.createdAt)}</div>
                            </div>
                            <div class="border-t border-b py-4">
                                <div class="prose max-w-none">${post.content}</div>
                            </div>
                        </div>
                    `,
                    buttons: [
                        { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' },
                        { label: '수정', type: 'primary', handler: `boardManager.editPost('${postId}'); adminUtils.closeModal()` }
                    ]
                });
            } else {
                // 간단히 alert로 표시 (테스트용)
                alert(`게시글 제목: ${post.title}\n작성자: ${post.author || '관리자'}\n내용: ${post.content.replace(/<[^>]*>?/gm, '')}`);
            }
        } catch (error) {
            console.error('게시글 보기 오류:', error);
            window.adminAuth?.showNotification('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시글 수정
     */
    editPost: async function(postId) {
        console.log('게시글 수정:', postId);
        
        try {
            let post = null;
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                // 게시판 컬렉션 이름
                const collectionName = `board_${this.currentBoardType}`;
                
                // 게시글 조회
                const result = await window.dbService.getDocument(collectionName, postId);
                
                if (result.success) {
                    post = result.data;
                } else {
                    window.adminAuth?.showNotification('게시글을 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                post = this.getMockPostById(postId);
                
                if (!post) {
                    alert('게시글을 찾을 수 없습니다.');
                    return;
                }
            }
            
            // 모달 표시
            const modal = document.getElementById('post-modal');
            const form = document.getElementById('post-form');
            const modalTitle = document.getElementById('modal-title');
            
            if (!modal || !form) {
                console.error('모달 또는 폼을 찾을 수 없습니다.');
                return;
            }
            
            // 폼 데이터 설정
            document.getElementById('post-title').value = post.title || '';
            document.getElementById('post-content').value = post.content || '';
            
            // 게시글 ID 저장
            form.dataset.postId = postId;
            
            // 모달 타이틀 설정
            if (modalTitle) {
                modalTitle.textContent = '게시글 수정';
            }
            
            // 모달 표시
            modal.classList.remove('hidden');
            
        } catch (error) {
            console.error('게시글 수정 폼 로드 오류:', error);
            window.adminAuth?.showNotification('게시글을 불러오는 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시글 수정 처리
     */
    handleUpdatePost: async function(event, postId) {
        event.preventDefault();
        
        try {
            // 폼 데이터 가져오기
            const form = event.target;
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            
            // 유효성 검사
            if (!title) {
                window.adminAuth?.showNotification('제목을 입력해주세요.', 'error');
                return;
            }
            
            if (!content) {
                window.adminAuth?.showNotification('내용을 입력해주세요.', 'error');
                return;
            }
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                // 게시판 컬렉션 이름
                const collectionName = `board_${this.currentBoardType}`;
                
                // 게시글 데이터
                const postData = {
                    title: title,
                    content: content,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };
                
                try {
                    const result = await window.dbService.updateDocument(collectionName, postId, postData);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('게시글이 수정되었습니다.', 'success');
                        this.closePostModal();
                        this.loadBoardData();
                    } else {
                        window.adminAuth?.showNotification('게시글 수정에 실패했습니다.', 'error');
                    }
                } catch (error) {
                    console.error('게시글 수정 오류:', error);
                    window.adminAuth?.showNotification('게시글 수정 중 오류가 발생했습니다.', 'error');
                }
            } else {
                // 테스트 환경
                console.log('게시글 수정 테스트:', { postId, boardType: this.currentBoardType, title, content });
                window.adminAuth?.showNotification('게시글이 수정되었습니다.', 'success');
                this.closePostModal();
                this.loadBoardData();
            }
        } catch (error) {
            console.error('게시글 수정 처리 오류:', error);
            window.adminAuth?.showNotification('게시글 수정 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시글 삭제
     */
    deletePost: function(postId) {
        console.log('게시글 삭제:', postId);
        
        if (confirm('정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.handleDeletePost(postId);
        }
    },
    
    /**
     * 게시글 삭제 처리
     */
    handleDeletePost: async function(postId) {
        try {
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                // 게시판 컬렉션 이름
                const collectionName = `board_${this.currentBoardType}`;
                
                try {
                    const result = await window.dbService.deleteDocument(collectionName, postId);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('게시글이 삭제되었습니다.', 'success');
                        this.loadBoardData();
                    } else {
                        window.adminAuth?.showNotification('게시글 삭제에 실패했습니다.', 'error');
                    }
                } catch (error) {
                    console.error('게시글 삭제 오류:', error);
                    window.adminAuth?.showNotification('게시글 삭제 중 오류가 발생했습니다.', 'error');
                }
            } else {
                // 테스트 환경
                console.log('게시글 삭제 테스트:', postId);
                window.adminAuth?.showNotification('게시글이 삭제되었습니다.', 'success');
                this.loadBoardData();
            }
        } catch (error) {
            console.error('게시글 삭제 처리 오류:', error);
            window.adminAuth?.showNotification('게시글 삭제 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 게시판 유형 이름 가져오기
     */
    getBoardTypeName: function(boardType) {
        switch (boardType) {
            case 'notice': return '공지사항';
            case 'column': return '칼럼';
            case 'materials': return '강의자료';
            case 'videos': return '동영상 강의';
            default: return boardType;
        }
    },
    
    /**
     * 날짜 포맷팅
     */
    formatDate: function(date, includeTime = false) {
        if (!date) return '-';
        
        try {
            if (typeof date.toDate === 'function') {
                date = date.toDate();
            } else if (typeof date === 'string') {
                return date;
            }
            
            if (window.formatters && typeof window.formatters.formatDate === 'function') {
                return includeTime ? 
                    window.formatters.formatDateTime(date) : 
                    window.formatters.formatDate(date);
            } else {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                if (includeTime) {
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}`;
                } else {
                    return `${year}-${month}-${day}`;
                }
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '-';
        }
    },
    
    /**
     * 테스트용 모의 게시글 데이터 가져오기
     */
    getMockPosts: function() {
        const posts = [
            {
                id: 'post1',
                title: '건강운동처방사 자격증 시험 일정 안내',
                content: '<p>2025년 1기 건강운동처방사 자격증 시험 일정을 안내합니다.</p><p>시험 일시: 2025년 4월 15일 14:00</p><p>장소: 센터 3층 대강당</p>',
                author: '관리자',
                viewCount: 152,
                createdAt: '2025-03-01'
            },
            {
                id: 'post2',
                title: '전문가 초청 세미나 개최 안내',
                content: '<p>운동과학 분야 전문가를 초청하여 세미나를 개최합니다.</p><p>일시: 2025년 3월 20일 15:00</p><p>장소: 센터 2층 세미나실</p>',
                author: '관리자',
                viewCount: 89,
                createdAt: '2025-03-05'
            },
            {
                id: 'post3',
                title: '운동재활전문가 과정 수강생 모집',
                content: '<p>2025년 운동재활전문가 과정 수강생을 모집합니다.</p><p>모집 기간: 2025년 3월 15일 ~ 3월 31일</p><p>문의: 02-123-4567</p>',
                author: '관리자',
                viewCount: 213,
                createdAt: '2025-03-10'
            },
            {
                id: 'post4',
                title: '센터 휴무 안내',
                content: '<p>2025년 3월 22일(토)은 시스템 점검으로 센터가 휴무입니다.</p>',
                author: '관리자',
                viewCount: 67,
                createdAt: '2025-03-15'
            },
            {
                id: 'post5',
                title: '필라테스 전문가 자격증 취득자 명단',
                content: '<p>2024년 4기 필라테스 전문가 자격증 취득자 명단을 공지합니다.</p><p>홍길동 외 24명</p>',
                author: '관리자',
                viewCount: 178,
                createdAt: '2025-03-18'
            }
        ];
        
        // 현재 선택된 게시판 유형에 맞는 게시글만 필터링
        return posts;
    },
    
    /**
     * ID로 테스트용 모의 게시글 데이터 가져오기
     */
    getMockPostById: function(postId) {
        const posts = this.getMockPosts();
        return posts.find(post => post.id === postId) || null;
    }
};

/**
 * 게시판 관리 페이지 초기화 함수
 */
window.initBoardManagement = async function() {
    try {
        console.log('게시판 관리 페이지 초기화 시작');
        
        // Firebase 초기화 대기
        if (window.dhcFirebase && typeof window.dhcFirebase.initialize === 'function') {
            await window.dhcFirebase.initialize();
        }
        
        // 관리자 권한 확인
        let hasAccess = true;
        if (window.adminAuth && typeof window.adminAuth.checkAdminAccess === 'function') {
            hasAccess = await window.adminAuth.checkAdminAccess();
        }
        
        if (hasAccess) {
            await window.boardManager.init();
        }
        
        console.log('게시판 관리 페이지 초기화 완료');
    } catch (error) {
        console.error('게시판 관리 페이지 초기화 오류:', error);
    }
};

// 이전 버전과의 호환성을 위한 함수
if (typeof window.scriptLoaderInitialized === 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        window.initBoardManagement();
    });
}