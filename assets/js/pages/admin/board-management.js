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
        console.log('게시글 작성 모달 표시 - 개선된 버전');

        // 모달 및 폼 가져오기
        const modal = document.getElementById('post-modal');
        const form = document.getElementById('post-form');
        const modalTitle = document.getElementById('modal-title');
        const contentEditor = document.getElementById('post-content');

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

        // 에디터 영역 초기화
        if (contentEditor) {
            contentEditor.value = '';
        }

        // 첨부파일 영역 초기화
        this.initializeAttachmentsSection();

        // 비디오 URL 필드 표시 (동영상 게시판인 경우)
        this.toggleVideoUrlField();

        // 모달 표시
        modal.classList.remove('hidden');

        // 에디터 도구 버튼 초기화
        this.initializeEditorTools();
    },

    /**
     * 에디터 도구 버튼 초기화
     */
    initializeEditorTools: function () {
        console.log('에디터 도구 버튼 초기화');

        const editorTools = document.querySelector('.editor-tools');
        if (!editorTools) {
            console.log('에디터 도구 영역을 찾을 수 없습니다. 생성합니다.');

            // 에디터 도구 영역 생성
            const contentGroup = document.querySelector('.content-group');
            if (contentGroup) {
                const toolsDiv = document.createElement('div');
                toolsDiv.className = 'editor-tools flex space-x-2 mb-2';
                toolsDiv.innerHTML = `
                <button type="button" class="tool-button px-2 py-1 bg-gray-200 rounded text-sm" data-tool="bold" title="굵게">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </button>
                <button type="button" class="tool-button px-2 py-1 bg-gray-200 rounded text-sm" data-tool="image" title="이미지 삽입">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </button>
                <button type="button" class="tool-button px-2 py-1 bg-gray-200 rounded text-sm" data-tool="link" title="링크 삽입">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                </button>
            `;

                // 에디터 내용 입력 필드 앞에 삽입
                const contentTextarea = contentGroup.querySelector('textarea');
                if (contentTextarea) {
                    contentGroup.insertBefore(toolsDiv, contentTextarea);
                }
            }
        }

        // 도구 버튼 이벤트 리스너
        const self = this;
        document.querySelectorAll('.tool-button').forEach(button => {
            // 기존 이벤트 제거 후 새로 등록
            button.removeEventListener('click', button._clickHandler);
            button._clickHandler = function (e) {
                e.preventDefault();
                const tool = this.getAttribute('data-tool');
                self.useEditorTool(tool);
            };
            button.addEventListener('click', button._clickHandler);
        });
    },

    /**
     * 에디터 도구 사용
     */
    useEditorTool: function (tool) {
        console.log(`에디터 도구 사용: ${tool}`);

        const contentEditor = document.getElementById('post-content');
        if (!contentEditor) return;

        const selStart = contentEditor.selectionStart;
        const selEnd = contentEditor.selectionEnd;
        const value = contentEditor.value;

        switch (tool) {
            case 'bold':
                // 선택한 텍스트를 굵게 처리 (<strong>)
                const boldText = `<strong>${value.substring(selStart, selEnd)}</strong>`;
                contentEditor.value = value.substring(0, selStart) + boldText + value.substring(selEnd);
                contentEditor.setSelectionRange(selStart + 8, selEnd + 8);
                break;

            case 'image':
                // 이미지 삽입 방법 선택 모달
                this.showImageInsertModal(selStart, selEnd);
                break;

            case 'link':
                // 선택한 텍스트를 링크로 만들기
                const selectedText = value.substring(selStart, selEnd);
                const linkUrl = prompt('링크 URL을 입력하세요:', 'https://');

                if (linkUrl && linkUrl.trim() !== '') {
                    const linkText = selectedText || '링크 텍스트';
                    const linkTag = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
                    contentEditor.value = value.substring(0, selStart) + linkTag + value.substring(selEnd);
                }
                break;
        }

        // 에디터에 포커스
        contentEditor.focus();
    },

    /**
     * 이미지 삽입 모달 표시
     */
    showImageInsertModal: function (selStart, selEnd) {
        console.log('이미지 삽입 모달 표시');

        // 이미 모달이 있다면 제거
        const existingModal = document.getElementById('image-insert-modal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }

        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'image-insert-modal';
        modal.className = 'fixed inset-0 flex items-center justify-center z-50';
        modal.innerHTML = `
        <div class="absolute inset-0 bg-black opacity-50"></div>
        <div class="relative bg-white rounded-lg w-full max-w-md p-6 z-10">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-medium">이미지 삽입</h3>
                <button type="button" class="close-modal text-gray-500 hover:text-gray-800">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">URL로 삽입</label>
                    <div class="flex space-x-2">
                        <input type="text" id="image-url-input" class="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="이미지 URL">
                        <button type="button" id="insert-url-image" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
                            삽입
                        </button>
                    </div>
                </div>
                
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">또는</span>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">파일에서 업로드</label>
                    <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md" id="image-dropzone">
                        <div class="space-y-1 text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <div class="flex text-sm text-gray-600">
                                <label for="image-file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                    <span>파일 선택</span>
                                    <input id="image-file-upload" name="image-file-upload" type="file" class="sr-only" accept="image/*">
                                </label>
                                <p class="pl-1">또는 이미지를 끌어다 놓으세요</p>
                            </div>
                            <p class="text-xs text-gray-500">PNG, JPG, GIF 파일 (10MB 이하)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        // 이벤트 리스너 등록
        const self = this;

        // 모달 닫기
        const closeButton = modal.querySelector('.close-modal');
        closeButton.addEventListener('click', function () {
            document.body.removeChild(modal);
        });

        // URL로 이미지 삽입
        const insertUrlButton = modal.querySelector('#insert-url-image');
        insertUrlButton.addEventListener('click', function () {
            const imageUrl = document.getElementById('image-url-input').value.trim();
            if (imageUrl) {
                self.insertImageIntoEditor(imageUrl, selStart, selEnd);
                document.body.removeChild(modal);
            } else {
                alert('이미지 URL을 입력하세요.');
            }
        });

        // 파일 업로드 처리
        const fileInput = modal.querySelector('#image-file-upload');
        fileInput.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) {
                self.handleImageUpload(e.target.files[0], selStart, selEnd);
                document.body.removeChild(modal);
            }
        });

        // 드래그 앤 드롭 영역 처리
        const dropzone = modal.querySelector('#image-dropzone');

        // 드래그 오버 이벤트
        dropzone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('border-indigo-500');
        });

        // 드래그 리브 이벤트
        dropzone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('border-indigo-500');
        });

        // 드롭 이벤트
        dropzone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('border-indigo-500');

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                // 이미지 파일 확인
                if (file.type.match('image.*')) {
                    self.handleImageUpload(file, selStart, selEnd);
                    document.body.removeChild(modal);
                } else {
                    alert('이미지 파일만 업로드 가능합니다.');
                }
            }
        });

        // 엔터키로 URL 입력 처리
        const urlInput = modal.querySelector('#image-url-input');
        urlInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                insertUrlButton.click();
            }
        });

        // 모달이 표시되면 URL 입력 필드에 포커스
        urlInput.focus();
    },

    /**
     * 이미지 업로드 처리
     */
    handleImageUpload: async function (file, selStart, selEnd) {
        console.log('이미지 업로드 처리:', file.name);

        try {
            // 사용자 인증 확인
            const currentUser = window.dhcFirebase.getCurrentUser();
            if (!currentUser) {
                throw new Error('이미지를 업로드하려면 로그인이 필요합니다.');
            }

            // 파일 크기 확인 (10MB 제한)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                alert('이미지 크기가 10MB를 초과하여 업로드할 수 없습니다.');
                return;
            }

            // 이미지 파일 타입 확인
            if (!file.type.match('image/.*')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            // 로딩 메시지 표시
            this.showLoadingMessage('이미지 업로드 중...');

            // 게시판 유형 및 사용자 ID 가져오기
            const boardType = this.currentBoardType;
            const userId = currentUser.uid;

            // 파일명에서 특수문자 제거
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

            // 중복 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const finalFileName = `${timestamp}_${randomStr}_${safeFileName}`;

            // 스토리지 경로 설정 (규칙에 맞게)
            const storagePath = `${boardType}_images/${userId}/${finalFileName}`;

            console.log('업로드 경로:', storagePath);

            // Firebase Storage에 파일 업로드
            const fileRef = window.dhcFirebase.storage.ref().child(storagePath);

            // 메타데이터 설정 (업로드한 사용자 ID 포함)
            const metadata = {
                contentType: file.type,
                customMetadata: {
                    'uploadedBy': userId,
                    'uploadTime': new Date().toISOString()
                }
            };

            // 업로드 진행 상황 추적 (디버깅용)
            const uploadTask = fileRef.put(file, metadata);
            uploadTask.on('state_changed',
                (snapshot) => {
                    // 업로드 진행률 계산
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`업로드 진행률: ${progress.toFixed(2)}%`);
                },
                (error) => {
                    // 업로드 오류 처리
                    console.error('업로드 오류:', error);
                    console.error('오류 코드:', error.code);
                    console.error('오류 메시지:', error.message);
                    this.hideLoadingMessage();

                    if (error.code === 'storage/unauthorized') {
                        alert('이미지 업로드 권한이 없습니다. 로그인 상태와 권한을 확인해주세요.');
                    } else {
                        alert('이미지 업로드 중 오류가 발생했습니다: ' + error.message);
                    }
                }
            );

            // 업로드 완료 후
            const snapshot = await uploadTask;
            console.log('업로드 완료:', snapshot.metadata);

            // 다운로드 URL 가져오기
            const downloadUrl = await snapshot.ref.getDownloadURL();
            console.log('다운로드 URL:', downloadUrl);

            // 이미지를 에디터에 삽입
            this.insertImageIntoEditor(downloadUrl, selStart, selEnd);

            // 로딩 메시지 숨김
            this.hideLoadingMessage();

        } catch (error) {
            console.error('이미지 업로드 처리 오류:', error);
            alert('이미지 업로드 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));

            // 로딩 메시지 숨김
            this.hideLoadingMessage();
        }
    },

    /**
     * 에디터에 이미지 삽입
     */
    insertImageIntoEditor: function (imageUrl, selStart, selEnd) {
        console.log('에디터에 이미지 삽입:', imageUrl);

        const contentEditor = document.getElementById('post-content');
        if (!contentEditor) return;

        const value = contentEditor.value;
        const imgTag = `<img src="${imageUrl}" alt="이미지" style="max-width:100%;" />`;

        contentEditor.value = value.substring(0, selStart) + imgTag + value.substring(selEnd);

        // 에디터에 포커스
        contentEditor.focus();
    },

    /**
     * 로딩 메시지 표시
     */
    showLoadingMessage: function (message) {
        console.log('로딩 메시지 표시:', message);

        // 이미 로딩 메시지가 있다면 제거
        this.hideLoadingMessage();

        // 로딩 메시지 요소 생성
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loading-message';
        loadingElement.className = 'fixed inset-0 flex items-center justify-center z-50';
        loadingElement.innerHTML = `
        <div class="absolute inset-0 bg-black opacity-30"></div>
        <div class="relative bg-white rounded-lg px-4 py-3 flex items-center z-10">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-gray-700">${message}</span>
        </div>
    `;

        document.body.appendChild(loadingElement);
    },

    /**
     * 로딩 메시지 숨김
     */
    hideLoadingMessage: function () {
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            document.body.removeChild(loadingElement);
        }
    },

    /**
     * 첨부파일 섹션 초기화
     */
    initializeAttachmentsSection: function () {
        console.log('첨부파일 섹션 초기화');

        // 첨부파일 영역 가져오기 또는 생성
        let attachmentsSection = document.querySelector('.attachments-section');

        if (!attachmentsSection) {
            console.log('첨부파일 영역 생성');

            // 폼 그룹 생성
            const formGroups = document.querySelectorAll('.form-group');
            const lastFormGroup = formGroups[formGroups.length - 1];

            if (lastFormGroup) {
                // 첨부파일 섹션 생성
                attachmentsSection = document.createElement('div');
                attachmentsSection.className = 'attachments-section mt-4';

                // 첨부파일 추가 버튼 및 목록 생성
                attachmentsSection.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 mb-2">첨부파일</label>
                <div class="file-upload-container">
                    <input type="file" id="file-upload" class="hidden" multiple />
                    <button type="button" id="add-file-button" class="px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                        파일 추가
                    </button>
                    <span class="text-sm text-gray-500 ml-2">최대 5개, 파일당 10MB 이하</span>
                </div>
                <ul id="attachment-list" class="mt-2 space-y-2 list-none"></ul>
            `;

                // 첨부파일 영역 삽입
                lastFormGroup.parentNode.insertBefore(attachmentsSection, lastFormGroup.nextSibling);

                // 파일 업로드 이벤트 리스너
                const fileUpload = attachmentsSection.querySelector('#file-upload');
                const addFileButton = attachmentsSection.querySelector('#add-file-button');

                if (fileUpload && addFileButton) {
                    const self = this;

                    // 파일 추가 버튼 클릭
                    addFileButton.addEventListener('click', function () {
                        fileUpload.click();
                    });

                    // 파일 선택 이벤트
                    fileUpload.addEventListener('change', function (e) {
                        self.handleFileSelect(e);
                    });
                }
            }
        } else {
            // 기존 첨부파일 목록 초기화
            const attachmentList = attachmentsSection.querySelector('#attachment-list');
            if (attachmentList) {
                attachmentList.innerHTML = '';
            }

            // 파일 입력 필드 초기화
            const fileUpload = attachmentsSection.querySelector('#file-upload');
            if (fileUpload) {
                fileUpload.value = '';
            }
        }
    },

    /**
     * 파일 선택 처리
     */
    handleFileSelect: function (event) {
        console.log('파일 선택 처리');

        const files = event.target.files;
        if (!files || files.length === 0) return;

        const attachmentList = document.getElementById('attachment-list');
        if (!attachmentList) return;

        // 현재 파일 목록 개수 확인
        const currentFiles = attachmentList.querySelectorAll('li').length;

        // 최대 5개 파일 제한
        const maxFiles = 5;
        let addedCount = 0;

        // 파일 검증 및 추가
        for (let i = 0; i < files.length; i++) {
            if (currentFiles + addedCount >= maxFiles) {
                alert(`첨부파일은 최대 ${maxFiles}개까지 가능합니다.`);
                break;
            }

            const file = files[i];

            // 파일 크기 검증 (10MB 제한)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                alert(`파일 '${file.name}'의 크기가 10MB를 초과하여 첨부할 수 없습니다.`);
                continue;
            }

            // 파일 확장자 확인
            const boardType = this.currentBoardType;
            const acceptableTypes = this.getAcceptableFileTypes(boardType);
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (!acceptableTypes.includes(fileExtension)) {
                alert(`'${fileExtension}' 형식의 파일은 첨부할 수 없습니다.\n허용된 파일 형식: ${acceptableTypes.join(', ')}`);
                continue;
            }

            // 파일 항목 생성
            const fileId = 'file-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            const li = document.createElement('li');
            li.id = fileId;
            li.className = 'file-item flex items-center justify-between';
            li.innerHTML = `
            <div class="flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                <span class="text-sm text-gray-800">${file.name}</span>
                <span class="text-xs text-gray-500 ml-2">(${this.formatFileSize(file.size)})</span>
            </div>
            <button type="button" class="remove-file text-red-500 hover:text-red-700" data-file-id="${fileId}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

            // 파일 객체 저장
            li.file = file;

            // 파일 목록에 추가
            attachmentList.appendChild(li);

            // 파일 삭제 버튼 이벤트
            const removeButton = li.querySelector('.remove-file');
            removeButton.addEventListener('click', function () {
                const fileId = this.getAttribute('data-file-id');
                const fileItem = document.getElementById(fileId);
                if (fileItem) {
                    fileItem.remove();
                }
            });

            addedCount++;
        }

        // 파일 입력 필드 초기화 (같은 파일 선택 시에도 이벤트 발생하도록)
        event.target.value = '';
    },

    /**
     * 게시판 유형에 따른 허용 파일 유형
     */
    getAcceptableFileTypes: function (boardType) {
        switch (boardType) {
            case 'materials':
                // 강의자료는 문서, 이미지, 압축 파일 허용
                return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'];
            case 'videos':
                // 동영상 강의는 문서, 이미지 허용
                return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
            default:
                // 기본적으로 이미지만 허용
                return ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
        }
    },

    /**
     * 파일 크기 포맷팅
     */
    formatFileSize: function (bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 비디오 URL 필드 표시 설정 (동영상 게시판 전용)
     */
    toggleVideoUrlField: function () {
        console.log('비디오 URL 필드 표시 설정');

        const videoUrlFieldContainer = document.querySelector('.video-url-container');

        // 동영상 게시판인 경우에만 표시
        if (this.currentBoardType === 'videos') {
            if (!videoUrlFieldContainer) {
                console.log('비디오 URL 필드 생성');

                // 폼 그룹 생성
                const formGroups = document.querySelectorAll('.form-group');

                if (formGroups.length > 0) {
                    const targetFormGroup = formGroups[1]; // 제목 입력 필드 다음

                    // 비디오 URL 컨테이너 생성
                    const videoUrlContainer = document.createElement('div');
                    videoUrlContainer.className = 'form-group video-url-container';
                    videoUrlContainer.innerHTML = `
                    <label for="video-url" class="block text-sm font-medium text-gray-700 mb-1">비디오 URL</label>
                    <div class="flex space-x-2">
                        <input type="text" id="video-url" name="video-url" class="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="유튜브 또는 직접 업로드 동영상 URL">
                        <select id="video-type" name="video-type" class="block w-32 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
                            <option value="youtube">유튜브</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="direct">직접 업로드</option>
                        </select>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">유튜브 동영상의 경우 "공유" 버튼을 통해 나오는 URL을 입력하세요.</p>
                `;

                    // 비디오 URL 필드 삽입
                    targetFormGroup.parentNode.insertBefore(videoUrlContainer, targetFormGroup.nextSibling);
                }
            } else {
                // 이미 존재하는 경우 표시
                videoUrlFieldContainer.classList.remove('hidden');
            }
        } else {
            // 동영상 게시판이 아닌 경우 숨김
            if (videoUrlFieldContainer) {
                videoUrlFieldContainer.classList.add('hidden');
            }
        }
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

            // 추가 필드 - 동영상 URL (동영상 게시판 전용)
            let videoUrl = null;
            let videoType = null;

            if (this.currentBoardType === 'videos') {
                videoUrl = document.getElementById('video-url')?.value || '';
                videoType = document.getElementById('video-type')?.value || 'youtube';

                // 동영상 URL 유효성 검사
                if (!videoUrl) {
                    alert('동영상 URL을 입력해주세요.');
                    if (submitButton) submitButton.disabled = false;
                    if (submitButton) submitButton.textContent = '저장';
                    return;
                }

                // 유튜브 URL 형식 확인
                if (videoType === 'youtube' && !this.isValidYoutubeUrl(videoUrl)) {
                    alert('유효한 유튜브 URL을 입력해주세요.');
                    if (submitButton) submitButton.disabled = false;
                    if (submitButton) submitButton.textContent = '저장';
                    return;
                }
            }

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

            // 첨부파일 처리
            const attachments = [];
            const attachmentList = document.getElementById('attachment-list');

            if (attachmentList) {
                const fileItems = attachmentList.querySelectorAll('li');

                // 첨부파일이 있는 경우 업로드 처리
                if (fileItems.length > 0) {
                    console.log(`첨부파일 처리: ${fileItems.length}개`);

                    // 로딩 상태 업데이트
                    if (submitButton) {
                        submitButton.textContent = `첨부파일 업로드 중 (0/${fileItems.length})...`;
                    }

                    // 각 파일 처리
                    for (let i = 0; i < fileItems.length; i++) {
                        const fileItem = fileItems[i];
                        const file = fileItem.file;

                        if (file) {
                            try {
                                // 로딩 상태 업데이트
                                if (submitButton) {
                                    submitButton.textContent = `첨부파일 업로드 중 (${i + 1}/${fileItems.length})...`;
                                }

                                // 스토리지 경로 설정
                                const storagePath = `${collectionName}/${uniqueId}/${file.name}`;

                                // Firebase Storage에 파일 업로드
                                const fileRef = window.dhcFirebase.storage.ref().child(storagePath);

                                // 파일 업로드 작업
                                const fileUploadTask = fileRef.put(file);

                                // 업로드 완료 대기
                                const snapshot = await fileUploadTask;

                                // 다운로드 URL 가져오기
                                const downloadUrl = await snapshot.ref.getDownloadURL();

                                // 첨부파일 정보 저장
                                attachments.push({
                                    name: file.name,
                                    url: downloadUrl,
                                    size: file.size,
                                    type: file.type,
                                    path: storagePath,
                                    createdAt: new Date()
                                });

                                console.log(`파일 업로드 성공: ${file.name}`);
                            } catch (error) {
                                console.error(`파일 업로드 오류 (${file.name}):`, error);
                                alert(`파일 '${file.name}' 업로드 중 오류가 발생했습니다: ${error.message}`);
                            }
                        }
                    }

                    console.log(`첨부파일 처리 완료: ${attachments.length}개`);

                    // 로딩 상태 업데이트
                    if (submitButton) {
                        submitButton.textContent = '게시글 저장 중...';
                    }
                }
            }

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

            // 첨부파일이 있으면 추가
            if (attachments.length > 0) {
                postData.attachments = attachments;
            }

            // 동영상 URL이 있으면 추가 (동영상 게시판 전용)
            if (this.currentBoardType === 'videos' && videoUrl) {
                postData.videoUrl = videoUrl;
                postData.videoType = videoType;
            }

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
     * 유튜브 URL 유효성 검사
     */
    isValidYoutubeUrl: function (url) {
        if (!url) return false;

        // 유튜브 영상 ID 추출 정규식
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        return regex.test(url);
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

            // 첨부파일 영역 초기화
            this.initializeAttachmentsSection();

            // 기존 첨부파일 표시
            if (post.attachments && post.attachments.length > 0) {
                this.displayExistingAttachments(post.attachments);
            }

            // 비디오 URL 필드 표시 (동영상 게시판인 경우)
            this.toggleVideoUrlField();

            // 비디오 URL 설정 (동영상 게시판인 경우)
            if (this.currentBoardType === 'videos') {
                const videoUrlInput = document.getElementById('video-url');
                const videoTypeSelect = document.getElementById('video-type');

                if (videoUrlInput && post.videoUrl) {
                    videoUrlInput.value = post.videoUrl;
                }

                if (videoTypeSelect && post.videoType) {
                    videoTypeSelect.value = post.videoType;
                }
            }

            // 에디터 도구 초기화
            this.initializeEditorTools();

            // 모달 표시
            modal.classList.remove('hidden');

        } catch (error) {
            console.error('게시글 수정 폼 로드 오류:', error);
            alert('게시글을 불러오는 중 오류가 발생했습니다: ' + error.message);
        }
    },

    /**
     * 기존 첨부파일 표시
     */
    displayExistingAttachments: function (attachments) {
        console.log('기존 첨부파일 표시:', attachments);

        const attachmentList = document.getElementById('attachment-list');
        if (!attachmentList) return;

        attachments.forEach((attachment, index) => {
            // 파일 항목 생성
            const fileId = 'existing-file-' + index;
            const li = document.createElement('li');
            li.id = fileId;
            li.className = 'file-item flex items-center justify-between existing-file';
            li.dataset.fileIndex = index;
            li.innerHTML = `
            <div class="flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                <span class="text-sm text-gray-800">${attachment.name}</span>
                <span class="text-xs text-gray-500 ml-2">(${this.formatFileSize(attachment.size)})</span>
            </div>
            <div class="flex space-x-1">
                <a href="${attachment.url}" target="_blank" class="text-blue-500 hover:text-blue-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
                <button type="button" class="remove-file text-red-500 hover:text-red-700" data-file-id="${fileId}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

            // 첨부파일 객체 저장
            li.attachment = attachment;

            // 파일 목록에 추가
            attachmentList.appendChild(li);

            // 파일 삭제 버튼 이벤트
            const removeButton = li.querySelector('.remove-file');
            removeButton.addEventListener('click', function () {
                const fileId = this.getAttribute('data-file-id');
                const fileItem = document.getElementById(fileId);
                if (fileItem) {
                    // 삭제 확인
                    if (confirm('이 첨부파일을 삭제하시겠습니까?')) {
                        fileItem.classList.add('to-be-deleted');
                        fileItem.style.opacity = '0.5';
                        fileItem.querySelector('.remove-file').style.display = 'none';
                    }
                }
            });
        });
    },

    /**
     * 게시글 수정 처리
     */
    handleUpdatePost: async function (event, postId) {
        event.preventDefault();

        // 중복 제출 방지
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            if (submitButton.disabled) {
                console.log('이미 처리 중인 요청입니다.');
                return;
            }
            submitButton.disabled = true;
            submitButton.textContent = '수정 중...';
        }

        try {
            console.log('게시글 수정 처리 시작:', postId);

            if (!postId) {
                throw new Error('게시글 ID가 없습니다.');
            }

            // 폼 데이터 가져오기
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            const category = document.getElementById('post-category')?.value || 'notice';

            // 추가 필드 - 동영상 URL (동영상 게시판 전용)
            let videoUrl = null;
            let videoType = null;

            if (this.currentBoardType === 'videos') {
                videoUrl = document.getElementById('video-url')?.value || '';
                videoType = document.getElementById('video-type')?.value || 'youtube';

                // 동영상 URL 유효성 검사
                if (!videoUrl) {
                    alert('동영상 URL을 입력해주세요.');
                    if (submitButton) submitButton.disabled = false;
                    if (submitButton) submitButton.textContent = '저장';
                    return;
                }

                // 유튜브 URL 형식 확인
                if (videoType === 'youtube' && !this.isValidYoutubeUrl(videoUrl)) {
                    alert('유효한 유튜브 URL을 입력해주세요.');
                    if (submitButton) submitButton.disabled = false;
                    if (submitButton) submitButton.textContent = '저장';
                    return;
                }
            }

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

            // 기존 게시글 데이터 조회
            const docRef = window.dhcFirebase.db.collection(collectionName).doc(postId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('게시글을 찾을 수 없습니다.');
            }

            const existingData = doc.data();

            // 첨부파일 처리
            const attachments = [];

            // 1. 기존 첨부파일 중 삭제되지 않은 파일 처리
            const existingAttachmentList = document.querySelectorAll('#attachment-list .existing-file');

            existingAttachmentList.forEach(fileItem => {
                // 삭제 표시가 되지 않은 파일만 유지
                if (!fileItem.classList.contains('to-be-deleted')) {
                    const index = fileItem.dataset.fileIndex;
                    if (existingData.attachments && existingData.attachments[index]) {
                        attachments.push(existingData.attachments[index]);
                    }
                }
            });

            // 2. 새로 추가된 첨부파일 처리
            const newAttachmentList = document.querySelectorAll('#attachment-list li:not(.existing-file):not(.to-be-deleted)');

            if (newAttachmentList.length > 0) {
                console.log(`새 첨부파일 처리: ${newAttachmentList.length}개`);

                // 중복 방지를 위한 고유 ID
                const uniqueId = existingData.uniqueId || (new Date().getTime() + '-' + Math.random().toString(36).substring(2, 9));

                // 로딩 상태 업데이트
                if (submitButton) {
                    submitButton.textContent = `첨부파일 업로드 중 (0/${newAttachmentList.length})...`;
                }

                // 각 파일 처리
                for (let i = 0; i < newAttachmentList.length; i++) {
                    const fileItem = newAttachmentList[i];
                    const file = fileItem.file;

                    if (file) {
                        try {
                            // 로딩 상태 업데이트
                            if (submitButton) {
                                submitButton.textContent = `첨부파일 업로드 중 (${i + 1}/${newAttachmentList.length})...`;
                            }

                            // 스토리지 경로 설정
                            const storagePath = `${collectionName}/${uniqueId}/${file.name}`;

                            // Firebase Storage에 파일 업로드
                            const fileRef = window.dhcFirebase.storage.ref().child(storagePath);

                            // 파일 업로드 작업
                            const fileUploadTask = fileRef.put(file);

                            // 업로드 완료 대기
                            const snapshot = await fileUploadTask;

                            // 다운로드 URL 가져오기
                            const downloadUrl = await snapshot.ref.getDownloadURL();

                            // 첨부파일 정보 저장
                            attachments.push({
                                name: file.name,
                                url: downloadUrl,
                                size: file.size,
                                type: file.type,
                                path: storagePath,
                                createdAt: new Date()
                            });

                            console.log(`새 파일 업로드 성공: ${file.name}`);
                        } catch (error) {
                            console.error(`파일 업로드 오류 (${file.name}):`, error);
                            alert(`파일 '${file.name}' 업로드 중 오류가 발생했습니다: ${error.message}`);
                        }
                    }
                }

                console.log(`첨부파일 처리 완료: ${attachments.length}개`);

                // 로딩 상태 업데이트
                if (submitButton) {
                    submitButton.textContent = '게시글 저장 중...';
                }
            }

            // 게시글 데이터
            const postData = {
                title: title,
                content: content,
                category: category,
                updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            };

            // 첨부파일이 있으면 추가
            if (attachments.length > 0) {
                postData.attachments = attachments;
            }

            // 동영상 URL이 있으면 추가 (동영상 게시판 전용)
            if (this.currentBoardType === 'videos') {
                if (videoUrl) {
                    postData.videoUrl = videoUrl;
                    postData.videoType = videoType;
                }
            }

            console.log('수정할 게시글 데이터:', postData);

            // Firestore 문서 업데이트
            await window.dhcFirebase.db.collection(collectionName).doc(postId).update(postData);

            console.log('게시글 수정 성공');
            alert('게시글이 수정되었습니다.');

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
            console.error('게시글 수정 처리 오류:', error);
            alert('게시글 수정 처리 중 오류가 발생했습니다: ' + error.message);

            // 버튼 상태 복원
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '저장';
            }
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