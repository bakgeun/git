/**
 * 게시판 관리 페이지 스크립트
 * 디버그용 버전 - 2025.05.19
 */

console.log('board-management.js 로드 시작 - 디버그 버전');

// 게시판 관리 객체
window.boardManager = {
    currentPage: 1,
    pageSize: 10,
    currentBoardType: 'notice', // 기본값: 공지사항
    lastDoc: null,

    /**
     * 초기화
     */
    init: async function () {
        try {
            console.log('게시판 관리자 초기화 시작 - 디버그 버전');

            // Firebase 초기화 확인
            await this.waitForFirebase();

            // 이벤트 리스너 등록
            this.registerEventListeners();

            // 바로 데이터 로드 (기본 공지사항)
            console.log('직접 데이터 로드 시작');
            await this.loadBoardData();

            // 게시판 탭 클릭 이벤트 처리
            const boardTabs = document.querySelectorAll('.board-tab');
            if (boardTabs.length > 0) {
                // 첫 번째 탭 활성화
                const firstTab = boardTabs[0];
                const boardType = firstTab.getAttribute('data-board') || 'notice';
                this.updateTabUI(boardType);
            }

            console.log('게시판 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('게시판 관리자 초기화 오류:', error);
            alert('초기화 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    },

    /**
     * Firebase 초기화 대기
     */
    waitForFirebase: async function () {
        console.log('Firebase 초기화 대기 중...');

        // 최대 10초 동안 시도
        const maxTries = 20;
        let tries = 0;

        while (tries < maxTries) {
            if (window.dhcFirebase && window.dhcFirebase.db) {
                console.log('Firebase 초기화 완료 확인됨');
                return true;
            }

            tries++;
            console.log(`Firebase 대기 중... (${tries}/${maxTries})`);

            // 500ms 대기
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.error('Firebase 초기화 시간 초과');
        throw new Error('Firebase 초기화가 제대로 완료되지 않았습니다.');
    },

    /**
     * 탭 UI 업데이트
     */
    updateTabUI: function (boardType) {
        console.log('탭 UI 업데이트:', boardType);

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
    },

    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners: function () {
        console.log('이벤트 리스너 등록 시작');

        // 전역 변수로 핸들러 함수 저장 (중복 등록 방지용)
        if (!window.formSubmitHandler) {
            window.formSubmitHandler = (e) => {
                e.preventDefault();
                const form = e.target;
                const postId = form.dataset.postId;
                if (postId) {
                    this.handleUpdatePost(e, postId);
                } else {
                    this.handleCreatePost(e);
                }
            };
        }

        // 게시판 탭 클릭 이벤트
        const boardTabs = document.querySelectorAll('.board-tab');
        const self = this;
        boardTabs.forEach(tab => {
            // 기존 이벤트 제거 후 새로 등록
            tab.removeEventListener('click', tab._clickHandler);
            tab._clickHandler = function (e) {
                e.preventDefault();
                const boardType = this.getAttribute('data-board');
                if (boardType) {
                    self.switchBoard(boardType);
                }
            };
            tab.addEventListener('click', tab._clickHandler);
        });

        // 게시글 작성 버튼
        const addPostButton = document.getElementById('add-post-button');
        if (addPostButton) {
            // 기존 이벤트 제거 후 새로 등록
            addPostButton.removeEventListener('click', addPostButton._clickHandler);
            addPostButton._clickHandler = function (e) {
                e.preventDefault();
                self.showAddPostModal();
            };
            addPostButton.addEventListener('click', addPostButton._clickHandler);
        }

        // 모달 관련 이벤트 리스너
        // 모달 닫기 버튼
        document.querySelectorAll('button[onclick="boardManager.closePostModal()"]').forEach(btn => {
            btn.removeAttribute('onclick');
            // 기존 이벤트 제거 후 새로 등록
            btn.removeEventListener('click', btn._clickHandler);
            btn._clickHandler = function (e) {
                e.preventDefault();
                self.closePostModal();
            };
            btn.addEventListener('click', btn._clickHandler);
        });

        // 폼 제출 이벤트
        const postForm = document.getElementById('post-form');
        if (postForm) {
            // 기존 이벤트 제거 후 새로 등록
            postForm.removeEventListener('submit', window.formSubmitHandler);
            postForm.addEventListener('submit', window.formSubmitHandler);
        }

        console.log('이벤트 리스너 등록 완료');
    },

    /**
     * 게시판 유형 전환
     */
    switchBoard: function (boardType) {
        // 이미 선택된 유형이면 무시
        if (this.currentBoardType === boardType) return;

        console.log('게시판 유형 전환:', boardType);

        // UI 업데이트
        this.updateTabUI(boardType);

        // 현재 게시판 유형 업데이트
        this.currentBoardType = boardType;
        this.currentPage = 1;
        this.lastDoc = null;

        // 게시판 데이터 로드
        this.loadBoardData();
    },

    /**
     * 게시판 데이터 로드
     */
    loadBoardData: async function () {
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

            // 컬렉션 이름 결정
            let collectionName;
            switch (this.currentBoardType) {
                case 'notice': collectionName = 'notices'; break;
                case 'column': collectionName = 'columns'; break;
                case 'materials': collectionName = 'materials'; break;
                case 'videos': collectionName = 'videos'; break;
                default: collectionName = 'notices';
            }

            console.log('사용 중인 컬렉션 이름:', collectionName);

            // Firebase 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.error('Firebase가 초기화되지 않았습니다.');
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 검색 조건 가져오기
            const searchType = document.getElementById('search-type')?.value || 'title';
            const searchKeyword = document.getElementById('search-keyword')?.value || '';

            // Firestore에서 직접 데이터 가져오기
            console.log('Firestore에서 직접 데이터 가져오기 시도...');
            let query = window.dhcFirebase.db.collection(collectionName);

            // 정렬 적용 (최신순)
            query = query.orderBy('createdAt', 'desc');

            // 페이지네이션 적용
            query = query.limit(this.pageSize);

            // 시작 지점 설정 (다음 페이지)
            if (this.currentPage > 1 && this.lastDoc) {
                query = query.startAfter(this.lastDoc);
            }

            // 검색 조건 적용
            if (searchKeyword) {
                console.log(`검색 조건: ${searchType} = ${searchKeyword}`);
            }

            // 쿼리 실행
            console.log('Firestore 쿼리 실행...');
            const snapshot = await query.get();

            console.log('쿼리 결과:', snapshot.size);

            let posts = [];
            if (snapshot.empty) {
                console.log('조회 결과: 문서 없음');
            } else {
                // 결과 처리
                snapshot.forEach(doc => {
                    const data = doc.data();
                    console.log('문서 데이터:', doc.id, data);
                    posts.push({
                        id: doc.id,
                        ...data
                    });
                });

                // 검색 필터링 (클라이언트 측)
                if (searchKeyword) {
                    const searchLower = searchKeyword.toLowerCase();
                    posts = posts.filter(post => {
                        if (searchType === 'title' && post.title) {
                            return post.title.toLowerCase().includes(searchLower);
                        } else if (searchType === 'content' && post.content) {
                            return post.content.toLowerCase().includes(searchLower);
                        } else if (searchType === 'author' && (post.author || post.authorName)) {
                            const author = (post.author || post.authorName || '').toLowerCase();
                            return author.includes(searchLower);
                        }
                        return false;
                    });
                }

                // 마지막 문서 저장 (다음 페이지 요청용)
                this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
            }

            console.log(`조회 결과: ${posts.length}개 항목`);

            // 전체 문서 수 조회
            console.log('전체 문서 수 조회...');
            const countSnapshot = await window.dhcFirebase.db.collection(collectionName).get();
            const totalCount = countSnapshot.size;
            const totalPages = Math.ceil(totalCount / this.pageSize);

            console.log(`전체 문서 수: ${totalCount}, 총 페이지: ${totalPages}`);

            // 페이지네이션 업데이트
            this.updatePagination(totalPages);

            // 게시글 목록 업데이트
            this.updateBoardList(posts);

        } catch (error) {
            console.error('게시판 데이터 로드 오류:', error);

            const tableBody = document.querySelector('#board-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-4 text-center text-red-500">
                            데이터 로드 중 오류가 발생했습니다.<br>
                            ${error.message || '알 수 없는 오류'}
                        </td>
                    </tr>
                `;
            }

            // 오류 알림
            alert('게시판 데이터를 불러오는 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
        }
    },

    /**
     * 게시글 목록 업데이트
     */
    updateBoardList: function (posts) {
        const tableBody = document.querySelector('#board-table tbody');
        if (!tableBody) {
            console.error('게시글 목록 테이블을 찾을 수 없습니다.');
            return;
        }

        console.log('게시글 목록 업데이트:', posts);

        if (!posts || posts.length === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="py-4 text-center text-gray-500">등록된 게시글이 없습니다.</td>
            </tr>
        `;
            return;
        }

        let html = '';

        posts.forEach((post, index) => {
            // 게시글 정보 디버깅 출력
            console.log(`게시글 ${index + 1}:`, post);

            // 날짜 포맷팅
            let createdAt = '-';

            if (post.createdAt) {
                try {
                    if (typeof post.createdAt.toDate === 'function') {
                        createdAt = this.formatDate(post.createdAt.toDate());
                    } else if (typeof post.createdAt === 'object' && post.createdAt.seconds) {
                        createdAt = this.formatDate(new Date(post.createdAt.seconds * 1000));
                    } else if (typeof post.createdAt === 'string') {
                        createdAt = post.createdAt;
                    }
                } catch (e) {
                    console.error('날짜 변환 오류:', e, post.createdAt);
                    createdAt = '-';
                }
            }

            const viewCount = post.views || post.viewCount || 0;
            const postId = post.id || '';
            const title = post.title || '(제목 없음)';
            const author = post.authorName || post.author || '관리자';

            html += `
            <tr>
                <td class="py-3 px-4">
                    <a href="#" class="text-indigo-600 hover:text-indigo-900 view-post" data-id="${postId}">
                        ${title}
                    </a>
                </td>
                <td class="py-3 px-4 text-center">${author}</td>
                <td class="py-3 px-4 text-center">${viewCount}</td>
                <td class="py-3 px-4 text-center">${createdAt}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        활성
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                    <div class="flex justify-center space-x-2">
                        <button class="text-indigo-600 hover:text-indigo-900 edit-post" data-id="${postId}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="text-red-600 hover:text-red-900 delete-post" data-id="${postId}">
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
        console.log('게시글 목록 HTML 업데이트 완료');

        // 이벤트 리스너 추가
        const self = this;

        // 이벤트 리스너 등록 (이전 리스너 제거를 위해 복제 및 교체)
        const newTableBody = tableBody.cloneNode(true);
        tableBody.parentNode.replaceChild(newTableBody, tableBody);

        newTableBody.querySelectorAll('.view-post').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                self.viewPost(postId);
            });
        });

        newTableBody.querySelectorAll('.edit-post').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                self.editPost(postId);
            });
        });

        newTableBody.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                self.deletePost(postId);
            });
        });
    },

    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function (totalPages) {
        const paginationContainer = document.getElementById('board-pagination');
        if (!paginationContainer) return;

        let html = '';

        if (totalPages > 1) {
            html = '<div class="flex justify-center space-x-1">';

            // 이전 페이지 버튼
            html += `
                <button class="px-4 py-2 border rounded-md text-sm prev-page
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
                    <button class="px-4 py-2 border rounded-md text-sm page-number" data-page="${i}"
                        ${this.currentPage === i ? 'style="background-color: #4f46e5; color: white;"' : 'style="background-color: white; color: #374151;"'}>
                        ${i}
                    </button>
                `;
            }

            // 다음 페이지 버튼
            html += `
                <button class="px-4 py-2 border rounded-md text-sm next-page
                    ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                    다음
                </button>
            `;

            html += '</div>';
        }

        paginationContainer.innerHTML = html;

        // 이벤트 리스너 추가
        const self = this;

        paginationContainer.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                self.changePage(page);
            });
        });

        const prevBtn = paginationContainer.querySelector('.prev-page');
        if (prevBtn) {
            prevBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (self.currentPage > 1) {
                    self.changePage(self.currentPage - 1);
                }
            });
        }

        const nextBtn = paginationContainer.querySelector('.next-page');
        if (nextBtn) {
            nextBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (self.currentPage < totalPages) {
                    self.changePage(self.currentPage + 1);
                }
            });
        }
    },

    /**
     * 페이지 변경
     */
    changePage: function (page) {
        if (page < 1) return;

        console.log(`페이지 변경: ${this.currentPage} → ${page}`);
        this.currentPage = page;
        this.loadBoardData();
    },

    /**
     * 검색
     */
    search: function () {
        console.log('게시글 검색 실행');

        this.currentPage = 1;
        this.lastDoc = null;
        this.loadBoardData();
    },

    /**
     * 검색 초기화
     */
    resetSearch: function () {
        console.log('검색 초기화');

        const searchType = document.getElementById('search-type');
        if (searchType) searchType.value = 'title';

        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) searchKeyword.value = '';

        this.currentPage = 1;
        this.lastDoc = null;
        this.loadBoardData();
    },

    /**
     * 게시글 작성 모달 표시
     */
    showAddPostModal: function () {
        console.log('게시글 작성 모달 표시');

        // 모달 및 폼 가져오기
        const modal = document.getElementById('post-modal');
        const form = document.getElementById('post-form');
        const modalTitle = document.getElementById('modal-title');

        // 모달 요소 확인
        if (!modal) {
            console.error('post-modal 요소를 찾을 수 없습니다.');
            alert('모달 요소를 찾을 수 없습니다. 페이지를 다시 로드해주세요.');
            return;
        }

        if (!form) {
            console.error('post-form 요소를 찾을 수 없습니다.');
            alert('폼 요소를 찾을 수 없습니다. 페이지를 다시 로드해주세요.');
            return;
        }

        // 모달 초기화
        form.reset();
        form.removeAttribute('data-post-id');

        // 카테고리 옵션 설정
        const categorySelect = document.getElementById('post-category');
        if (categorySelect) {
            this.setupCategoryOptions(categorySelect);
        }

        // 모달 타이틀 설정
        if (modalTitle) {
            modalTitle.textContent = '게시글 작성';
        }

        // 모달 표시
        modal.classList.remove('hidden');
    },

    /**
     * 게시판 유형에 맞는 카테고리 옵션 설정
     */
    setupCategoryOptions: function (selectElement) {
        if (!selectElement) return;

        // 기존 옵션 제거
        selectElement.innerHTML = '';

        // 게시판 유형에 맞는 카테고리 옵션 추가
        const categories = this.getCategoriesByBoardType(this.currentBoardType);

        // 기본 옵션 추가
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 카테고리 선택 --';
        selectElement.appendChild(defaultOption);

        // 카테고리 옵션 추가
        for (const key in categories) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = categories[key];
            selectElement.appendChild(option);
        }
    },

    /**
     * 게시판 유형에 맞는 카테고리 가져오기
     */
    getCategoriesByBoardType: function (boardType) {
        switch (boardType) {
            case 'notice':
                return {
                    'notice': '일반공지',
                    'education': '교육안내',
                    'exam': '시험안내',
                    'event': '행사안내'
                };
            case 'column':
                return {
                    'health': '건강정보',
                    'exercise': '운동방법',
                    'nutrition': '영양정보',
                    'rehabilitation': '재활정보'
                };
            case 'materials':
                return {
                    'lecture': '강의자료',
                    'reference': '참고자료',
                    'exercise': '실습자료',
                    'exam': '시험자료'
                };
            case 'videos':
                return {
                    'theory': '이론강의',
                    'practice': '실습강의',
                    'special': '특강',
                    'review': '복습자료'
                };
            default:
                return { 'default': '기본 카테고리' };
        }
    },

    /**
     * 게시글 모달 닫기
     */
    closePostModal: function () {
        const modal = document.getElementById('post-modal');
        if (modal) {
            modal.classList.add('hidden');

            // 폼 리셋
            const form = document.getElementById('post-form');
            if (form) {
                form.reset();
                form.removeAttribute('data-post-id');

                // 제출 버튼 상태 복구
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '저장';
                }
            }
        }
    },

    /**
     * 게시글 작성 처리
     */
    handleCreatePost: async function (event) {
        event.preventDefault();

        // 중복 제출 방지
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            if (submitButton.disabled) {
                console.log('이미 처리 중인 요청입니다.');
                return;
            }
            submitButton.disabled = true;
            submitButton.textContent = '저장 중...';
        }

        try {
            console.log('게시글 작성 처리 시작');

            // 폼 데이터 가져오기
            const form = event.target;
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            const category = document.getElementById('post-category')?.value || 'notice';

            // 유효성 검사
            if (!title) {
                alert('제목을 입력해주세요.');
                if (submitButton) submitButton.disabled = false;
                if (submitButton) submitButton.textContent = '저장';
                return;
            }

            if (!content) {
                alert('내용을 입력해주세요.');
                if (submitButton) submitButton.disabled = false;
                if (submitButton) submitButton.textContent = '저장';
                return;
            }

            if (!category) {
                alert('카테고리를 선택해주세요.');
                if (submitButton) submitButton.disabled = false;
                if (submitButton) submitButton.textContent = '저장';
                return;
            }

            // Firebase 연동 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 게시판 컬렉션 이름 매핑
            const collectionMap = {
                'notice': 'notices',
                'column': 'columns',
                'materials': 'materials',
                'videos': 'videos'
            };

            // 게시판 컬렉션 이름
            const collectionName = collectionMap[this.currentBoardType] || 'notices';
            console.log('저장 대상 컬렉션:', collectionName);

            // 현재 로그인한 사용자 정보 가져오기
            const currentUser = window.dhcFirebase.getCurrentUser();
            const userId = currentUser ? currentUser.uid : null;
            const userEmail = currentUser ? currentUser.email : '관리자';

            // 중복 방지를 위한 고유 ID 생성 (타임스탬프 + 랜덤 문자열)
            const uniqueId = new Date().getTime() + '-' + Math.random().toString(36).substring(2, 9);

            // 게시글 데이터
            const postData = {
                title: title,
                content: content,
                category: category,
                authorId: userId,
                authorName: userEmail,
                author: userEmail,
                views: 0,
                uniqueId: uniqueId, // 중복 체크용 필드 추가
                createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('게시글 데이터:', postData);

            // 중복 체크 - 브라우저 세션 스토리지 사용 (간단한 방법)
            const recentSubmissions = JSON.parse(sessionStorage.getItem('recentSubmissions') || '[]');
            if (recentSubmissions.some(item => item.title === title && (Date.now() - item.timestamp) < 30000)) {
                console.log('중복 게시글 감지!', title);
                alert('동일한 게시글이 최근에 이미 등록되었습니다.');

                // 모달 닫기
                this.closePostModal();

                // 버튼 상태 복원
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '저장';
                }

                return;
            }

            // 최근 제출 목록에 추가
            recentSubmissions.push({
                title: title,
                timestamp: Date.now()
            });

            // 최근 항목만 유지 (최대 10개)
            while (recentSubmissions.length > 10) {
                recentSubmissions.shift();
            }

            // 세션 스토리지에 저장
            sessionStorage.setItem('recentSubmissions', JSON.stringify(recentSubmissions));

            // Firestore에 데이터 저장
            try {
                // 문서 추가
                const docRef = await window.dhcFirebase.db.collection(collectionName).add(postData);

                console.log('게시글 등록 성공:', docRef.id);
                alert('게시글이 등록되었습니다.');

                // 모달 닫기
                this.closePostModal();

                // 버튼 상태 복원
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '저장';
                }

                // 게시글 목록 새로고침 (잠시 대기 후)
                setTimeout(() => {
                    this.loadBoardData();
                }, 1000);

            } catch (error) {
                console.error('게시글 저장 오류:', error);
                alert('게시글 저장 중 오류가 발생했습니다: ' + error.message);

                // 버튼 상태 복원
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '저장';
                }
            }

        } catch (error) {
            console.error('게시글 작성 처리 오류:', error);
            alert('게시글 작성 처리 중 오류가 발생했습니다: ' + error.message);

            // 버튼 상태 복원
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '저장';
            }
        }
    },

    /**
     * 게시글 보기
     */
    viewPost: async function (postId) {
        console.log('게시글 보기:', postId);

        try {
            if (!postId) {
                throw new Error('게시글 ID가 없습니다.');
            }

            // 게시판 컬렉션 이름 매핑
            const collectionMap = {
                'notice': 'notices',
                'column': 'columns',
                'materials': 'materials',
                'videos': 'videos'
            };

            // 컬렉션 이름 결정
            const collectionName = collectionMap[this.currentBoardType] || 'notices';

            // Firebase 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 게시글 조회
            const docRef = window.dhcFirebase.db.collection(collectionName).doc(postId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            // 게시글 데이터
            const post = {
                id: doc.id,
                ...doc.data()
            };

            console.log('조회된 게시글:', post);

            // 날짜 변환
            let createdAt = '-';
            if (post.createdAt) {
                try {
                    if (typeof post.createdAt.toDate === 'function') {
                        createdAt = this.formatDate(post.createdAt.toDate());
                    } else if (typeof post.createdAt === 'object' && post.createdAt.seconds) {
                        createdAt = this.formatDate(new Date(post.createdAt.seconds * 1000));
                    } else if (typeof post.createdAt === 'string') {
                        createdAt = post.createdAt;
                    }
                } catch (e) {
                    console.error('날짜 변환 오류:', e);
                }
            }

            // 내용 표시 (모달)
            const viewModalId = 'view-post-modal';
            let viewModal = document.getElementById(viewModalId);

            // 이미 있는 모달 제거
            if (viewModal) {
                document.body.removeChild(viewModal);
            }

            // 새 모달 생성
            viewModal = document.createElement('div');
            viewModal.id = viewModalId;
            viewModal.className = 'fixed inset-0 flex items-center justify-center z-50';
            viewModal.innerHTML = `
                <div class="absolute inset-0 bg-black opacity-50"></div>
                <div class="relative bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-auto p-6 z-10">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-xl font-semibold">${post.title}</h2>
                        <button class="text-gray-500 hover:text-gray-800 close-modal">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="flex justify-between text-sm text-gray-500 mb-4">
                        <div>작성자: ${post.authorName || post.author || '관리자'}</div>
                        <div>작성일: ${createdAt}</div>
                    </div>
                    <div class="border-t border-b py-4 mb-4">
                        <div class="prose max-w-none">${post.content}</div>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 close-modal">닫기</button>
                        <button class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 edit-button" data-id="${postId}">수정</button>
                    </div>
                </div>
            `;

            document.body.appendChild(viewModal);

            // 닫기 버튼 이벤트
            const self = this;
            viewModal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', function () {
                    document.body.removeChild(viewModal);
                });
            });

            // 수정 버튼 이벤트
            viewModal.querySelector('.edit-button').addEventListener('click', function () {
                document.body.removeChild(viewModal);
                self.editPost(this.getAttribute('data-id'));
            });

        } catch (error) {
            console.error('게시글 보기 오류:', error);
            alert('게시글을 불러오는 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * 게시글 수정
     */
    editPost: async function (postId) {
        console.log('게시글 수정:', postId);

        try {
            if (!postId) {
                throw new Error('게시글 ID가 없습니다.');
            }

            // 게시판 컬렉션 이름 매핑
            const collectionMap = {
                'notice': 'notices',
                'column': 'columns',
                'materials': 'materials',
                'videos': 'videos'
            };

            // 컬렉션 이름 결정
            const collectionName = collectionMap[this.currentBoardType] || 'notices';

            // Firebase 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 게시글 조회
            const docRef = window.dhcFirebase.db.collection(collectionName).doc(postId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            // 게시글 데이터
            const post = {
                id: doc.id,
                ...doc.data()
            };

            console.log('수정할 게시글:', post);

            // 모달 및 폼 가져오기
            const modal = document.getElementById('post-modal');
            const form = document.getElementById('post-form');
            const modalTitle = document.getElementById('modal-title');
            const titleInput = document.getElementById('post-title');
            const contentInput = document.getElementById('post-content');
            const categorySelect = document.getElementById('post-category');

            // 모달 요소 확인
            if (!modal || !form || !titleInput || !contentInput) {
                throw new Error('모달 또는 폼 요소를 찾을 수 없습니다.');
            }

            // 카테고리 옵션 설정
            if (categorySelect) {
                this.setupCategoryOptions(categorySelect);
            }

            // 폼 데이터 설정
            titleInput.value = post.title || '';
            contentInput.value = post.content || '';

            // 카테고리 선택
            if (categorySelect && post.category) {
                categorySelect.value = post.category;
            }

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
            alert('게시글을 불러오는 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * 게시글 수정 처리
     */
    handleUpdatePost: async function (event, postId) {
        event.preventDefault();

        try {
            console.log('게시글 수정 처리 시작:', postId);

            if (!postId) {
                throw new Error('게시글 ID가 없습니다.');
            }

            // 폼 데이터 가져오기
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            const category = document.getElementById('post-category')?.value || 'notice';

            // 유효성 검사
            if (!title) {
                alert('제목을 입력해주세요.');
                return;
            }

            if (!content) {
                alert('내용을 입력해주세요.');
                return;
            }

            if (!category) {
                alert('카테고리를 선택해주세요.');
                return;
            }

            // 게시판 컬렉션 이름 매핑
            const collectionMap = {
                'notice': 'notices',
                'column': 'columns',
                'materials': 'materials',
                'videos': 'videos'
            };

            // 컬렉션 이름 결정
            const collectionName = collectionMap[this.currentBoardType] || 'notices';

            // Firebase 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // 게시글 데이터
            const postData = {
                title: title,
                content: content,
                category: category,
                updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('수정할 게시글 데이터:', postData);

            // Firestore 문서 업데이트
            await window.dhcFirebase.db.collection(collectionName).doc(postId).update(postData);

            console.log('게시글 수정 성공');
            alert('게시글이 수정되었습니다.');

            // 모달 닫기
            this.closePostModal();

            // 게시글 목록 새로고침 (잠시 대기 후)
            setTimeout(() => {
                this.loadBoardData();
            }, 1000);

        } catch (error) {
            console.error('게시글 수정 처리 오류:', error);
            alert('게시글 수정 처리 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * 게시글 삭제
     */
    deletePost: function (postId) {
        console.log('게시글 삭제:', postId);

        if (confirm('정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.handleDeletePost(postId);
        }
    },

    /**
     * 게시글 삭제 처리
     */
    handleDeletePost: async function (postId) {
        try {
            console.log('게시글 삭제 처리 시작:', postId);

            if (!postId) {
                throw new Error('게시글 ID가 없습니다.');
            }

            // 게시판 컬렉션 이름 매핑
            const collectionMap = {
                'notice': 'notices',
                'column': 'columns',
                'materials': 'materials',
                'videos': 'videos'
            };

            // 컬렉션 이름 결정
            const collectionName = collectionMap[this.currentBoardType] || 'notices';

            // Firebase 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            // Firestore 문서 삭제
            await window.dhcFirebase.db.collection(collectionName).doc(postId).delete();

            console.log('게시글 삭제 성공');
            alert('게시글이 삭제되었습니다.');

            // 게시글 목록 새로고침
            this.loadBoardData();

        } catch (error) {
            console.error('게시글 삭제 처리 오류:', error);
            alert('게시글 삭제 처리 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * 게시판 유형 이름 가져오기
     */
    getBoardTypeName: function (boardType) {
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
    formatDate: function (date, includeTime = false) {
        if (!date) return '-';

        try {
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
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '-';
        }
    },

    /**
     * 테스트용 모의 게시글 데이터 가져오기
     */
    getMockPosts: function () {
        return [
            {
                id: 'test1',
                title: '테스트 게시글 1',
                content: '테스트 내용입니다.',
                author: '관리자',
                views: 10,
                createdAt: new Date().toISOString()
            },
            {
                id: 'test2',
                title: '테스트 게시글 2',
                content: '테스트 내용입니다.',
                author: '관리자',
                views: 5,
                createdAt: new Date().toISOString()
            }
        ];
    }
};

/**
 * 게시판 관리 페이지 초기화 함수
 */
window.initBoardManagement = async function () {
    try {
        console.log('게시판 관리 페이지 초기화 시작 - 디버그 버전');

        // 관리자 권한 확인
        let hasAccess = true;
        if (window.adminAuth && typeof window.adminAuth.checkAdminAccess === 'function') {
            hasAccess = await window.adminAuth.checkAdminAccess();
        }

        if (hasAccess) {
            // 초기화 실행
            await window.boardManager.init();
        }

        console.log('게시판 관리 페이지 초기화 완료');
    } catch (error) {
        console.error('게시판 관리 페이지 초기화 오류:', error);
        alert('게시판 관리 페이지 초기화 중 오류가 발생했습니다: ' + error.message);
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded 이벤트 발생 - 게시판 관리 초기화 시작');
    window.initBoardManagement();
});

// 이미 DOM이 로드된 경우 바로 초기화
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('문서 이미 로드됨 - 게시판 관리 즉시 초기화');
    setTimeout(window.initBoardManagement, 100);
}

console.log('board-management.js 로드 완료 - 디버그 버전');