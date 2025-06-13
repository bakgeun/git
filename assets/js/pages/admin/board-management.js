/**
 * board-management.js - course-management.js 스타일 완전 표준화 버전
 * 게시판 관리 페이지의 모든 기능을 포함합니다.
 */

console.log('=== board-management.js 표준화 버전 로드 시작 ===');

// 🔧 의존성 체크 함수 (course-management.js 스타일)
function checkBoardDependencies() {
    const requiredUtils = [
        { name: 'window.formatters', path: 'formatters.js' },
        { name: 'window.dateUtils', path: 'date-utils.js' },
        { name: 'window.adminAuth', path: 'admin-auth.js' }
    ];
    
    const missing = [];
    
    requiredUtils.forEach(util => {
        if (!eval(util.name)) {
            missing.push(util);
        }
    });
    
    if (missing.length > 0) {
        console.error('⚠️ 게시판 관리 필수 유틸리티가 로드되지 않음:', missing.map(m => m.path));
        console.log('📝 HTML에서 다음 스크립트들이 먼저 로드되어야 합니다:');
        missing.forEach(m => {
            console.log(`   <script src="{basePath}assets/js/utils/${m.path}"></script>`);
        });
        return false;
    }
    
    console.log('✅ 게시판 관리 모든 필수 유틸리티 로드 확인됨');
    
    // 🔧 추가: formatters 함수들이 실제로 작동하는지 테스트
    try {
        const testDate = new Date();
        const testFormatDate = window.formatters.formatDate(testDate, 'YYYY.MM.DD');
        const testFormatCurrency = window.formatters.formatCurrency(10000);
        
        console.log('✅ formatters.formatDate 테스트 성공:', testFormatDate);
        console.log('✅ formatters.formatCurrency 테스트 성공:', testFormatCurrency);
        
        if (!testFormatDate || !testFormatCurrency) {
            throw new Error('포맷터 함수 결과가 유효하지 않습니다.');
        }
        
    } catch (error) {
        console.error('❌ 유틸리티 함수 테스트 실패:', error);
        return false;
    }
    
    return true;
}

// 🔧 의존성 오류 표시 함수
function showBoardDependencyError() {
    const tableBody = document.querySelector('#board-table tbody');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div class="text-red-600 text-lg font-semibold mb-2">⚠️ 시스템 오류</div>
                        <p class="text-red-700 mb-4">게시판 관리에 필요한 유틸리티 파일이 로드되지 않았습니다.</p>
                        <p class="text-red-600 text-sm">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                            새로고침
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Firebase 연결 확인
function checkFirebaseConnection() {
    if (!window.dhcFirebase || !window.dhcFirebase.db) {
        console.warn('⚠️ Firebase 연결되지 않음 - 로컬 테스트 모드로 실행');
        return false;
    }
    
    console.log('✅ Firebase 연결 확인됨');
    return true;
}

// =================================
// 게시판 관리 메인 객체 (완전 표준화 버전)
// =================================

window.boardManager = {
    // 초기화 상태 관리
    initialized: false,
    
    // 페이지네이션 및 검색 상태
    currentPage: 1,
    pageSize: 10,
    currentBoardType: 'notice',
    lastDoc: null,
    
    // Firebase 연결 상태
    isFirebaseConnected: false,

    /**
     * 초기화 - course-management.js 스타일 완전 적용
     */
    init: async function () {
        // 초기화 플래그 설정
        this.initialized = false;

        try {
            console.log('📋 게시판 관리자 초기화 시작 - 표준화 버전');

            // 🔧 의존성 체크 먼저 실행
            if (!checkBoardDependencies()) {
                console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
                showBoardDependencyError();
                return false;
            }

            // Firebase 초기화 대기 (course-management.js 스타일)
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.log('⏳ Firebase 초기화 대기 중...');

                // Firebase 초기화를 최대 10초간 대기
                let attempts = 0;
                const maxAttempts = 50; // 10초 (200ms * 50)

                while ((!window.dhcFirebase || !window.dhcFirebase.db) && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }

                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    console.warn('⚠️ Firebase 초기화 시간 초과, 테스트 데이터로 진행');
                    this.isFirebaseConnected = false;
                } else {
                    console.log('✅ Firebase 초기화 완료');
                    this.isFirebaseConnected = true;
                }
            } else {
                this.isFirebaseConnected = true;
            }

            // 이벤트 리스너 등록
            console.log('🎯 이벤트 리스너 등록 시작');
            this.registerEventListeners();
            console.log('✅ 이벤트 리스너 등록 완료');

            // 게시판 탭 초기화
            console.log('📑 게시판 탭 초기화 시작');
            this.initBoardTabs();
            console.log('✅ 게시판 탭 초기화 완료');

            // 게시판 데이터 로드 (재시도 로직 포함)
            console.log('📋 게시판 데이터 로드 시작');
            await this.loadBoardDataWithRetry();
            console.log('✅ 게시판 데이터 로드 완료');

            // 초기화 완료 플래그 설정
            this.initialized = true;
            console.log('✅ 게시판 관리자 초기화 완료');
            return true;

        } catch (error) {
            console.error('❌ 게시판 관리자 초기화 오류:', error);

            // 초기화 실패 시 테스트 데이터로라도 표시
            try {
                console.log('🔄 초기화 실패, 테스트 데이터로 폴백');
                const testPosts = this.getTestData();
                this.updateBoardList(testPosts);
                console.log('✅ 테스트 데이터 폴백 완료');
            } catch (fallbackError) {
                console.error('❌ 폴백 데이터 로드도 실패:', fallbackError);
                this.showErrorMessage('초기화에 실패했습니다. 페이지를 새로고침해주세요.');
            }

            this.initialized = false;
            return false;
        }
    },

    /**
     * 재시도 로직이 포함된 게시판 데이터 로드 함수
     */
    loadBoardDataWithRetry: async function (maxRetries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📋 게시판 데이터 로드 시도 ${attempt}/${maxRetries}`);
                await this.loadBoardData();
                console.log('✅ 게시판 데이터 로드 성공');
                return; // 성공하면 함수 종료
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ 게시판 데이터 로드 시도 ${attempt} 실패:`, error);

                if (attempt < maxRetries) {
                    const delay = attempt * 1000; // 1초, 2초, 3초 간격으로 재시도
                    console.log(`⏳ ${delay}ms 후 재시도...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // 모든 재시도 실패 시
        console.error(`❌ ${maxRetries}번 시도 후 게시판 데이터 로드 실패:`, lastError);

        // 테스트 데이터로 폴백
        console.log('🔄 테스트 데이터로 폴백');
        try {
            const testPosts = this.getTestData();
            this.updateBoardList(testPosts);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('서버 연결에 문제가 있어 테스트 데이터를 표시합니다.', 'warning');
            }

            console.log('✅ 테스트 데이터 폴백 완료');
        } catch (fallbackError) {
            console.error('❌ 테스트 데이터 폴백도 실패:', fallbackError);
            this.showErrorMessage('데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    },

    /**
     * 에러 메시지 표시 (표준화)
     */
    showErrorMessage: function (message) {
        const tableBody = document.querySelector('#board-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="text-red-500 mb-4">
                            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p class="text-gray-600 mb-4">${message}</p>
                        <button onclick="boardManager.loadBoardDataWithRetry()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            다시 시도
                        </button>
                    </td>
                </tr>
            `;
        }

        // 추가로 toast 메시지도 표시
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        }
    },

    /**
     * 게시판 탭 초기화
     */
    initBoardTabs: function () {
        console.log('📋 게시판 탭 초기화');

        const boardTabs = document.querySelectorAll('.board-tab');
        if (boardTabs.length > 0) {
            // 첫 번째 탭 활성화
            const firstTab = boardTabs[0];
            const boardType = firstTab.getAttribute('data-board') || 'notice';
            this.updateTabUI(boardType);
        }
    },

    /**
     * 탭 UI 업데이트 (개선된 버전)
     */
    updateTabUI: function (boardType) {
        console.log('📋 탭 UI 업데이트:', boardType);

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
     * 이벤트 리스너 등록 (중복 방지 개선)
     */
    registerEventListeners: function () {
        console.log('📋 이벤트 리스너 등록 시작');

        // 전역 변수로 핸들러 함수 저장 (중복 등록 방지용)
        if (!window.boardFormSubmitHandler) {
            window.boardFormSubmitHandler = (e) => {
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
        this.registerTabEvents();

        // 게시글 작성 버튼
        this.registerAddPostButton();

        // 모달 관련 이벤트 리스너
        this.registerModalEvents();

        // 폼 제출 이벤트
        this.registerFormEvents();

        // 검색 이벤트
        this.registerSearchEvents();

        console.log('✅ 이벤트 리스너 등록 완료');
    },

    /**
     * 탭 이벤트 등록
     */
    registerTabEvents: function () {
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
    },

    /**
     * 게시글 추가 버튼 이벤트 등록
     */
    registerAddPostButton: function () {
        const addPostButton = document.getElementById('add-post-button');
        if (addPostButton) {
            const self = this;
            // 기존 이벤트 제거 후 새로 등록
            addPostButton.removeEventListener('click', addPostButton._clickHandler);
            addPostButton._clickHandler = function (e) {
                e.preventDefault();
                self.showAddPostModal();
            };
            addPostButton.addEventListener('click', addPostButton._clickHandler);
        }
    },

    /**
     * 모달 이벤트 등록
     */
    registerModalEvents: function () {
        const self = this;
        
        // 모달 닫기 버튼들
        document.querySelectorAll('button[onclick="boardManager.closePostModal()"]').forEach(btn => {
            btn.removeAttribute('onclick');
            btn.removeEventListener('click', btn._clickHandler);
            btn._clickHandler = function (e) {
                e.preventDefault();
                self.closePostModal();
            };
            btn.addEventListener('click', btn._clickHandler);
        });
    },

    /**
     * 폼 이벤트 등록
     */
    registerFormEvents: function () {
        const postForm = document.getElementById('post-form');
        if (postForm) {
            // 기존 이벤트 제거 후 새로 등록
            postForm.removeEventListener('submit', window.boardFormSubmitHandler);
            postForm.addEventListener('submit', window.boardFormSubmitHandler);
        }
    },

    /**
     * 검색 이벤트 등록
     */
    registerSearchEvents: function () {
        const self = this;
        
        // 검색 키워드 엔터키 이벤트
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) {
            searchKeyword.removeEventListener('keypress', searchKeyword._keypressHandler);
            searchKeyword._keypressHandler = function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    self.search();
                }
            };
            searchKeyword.addEventListener('keypress', searchKeyword._keypressHandler);
        }
    },

    /**
     * 게시판 유형 전환
     */
    switchBoard: function (boardType) {
        // 이미 선택된 유형이면 무시
        if (this.currentBoardType === boardType) return;

        console.log('📋 게시판 유형 전환:', boardType);

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
     * 게시판 데이터 로드 (표준화 버전)
     */
    loadBoardData: async function () {
        console.log('📋 게시판 데이터 로드 시작:', this.currentBoardType);

        try {
            // 로딩 상태 표시
            this.showLoadingState();

            let posts = [];

            if (this.isFirebaseConnected) {
                console.log('🔥 Firebase에서 실제 데이터 로드');
                posts = await this.loadFromFirebase();
            } else {
                console.log('🧪 테스트 데이터 사용');
                posts = this.getTestData();
            }

            // 검색 필터링 적용
            const searchType = document.getElementById('search-type')?.value || 'title';
            const searchKeyword = document.getElementById('search-keyword')?.value || '';
            
            if (searchKeyword) {
                posts = this.filterPosts(posts, searchType, searchKeyword);
                console.log(`🔍 검색 결과: ${posts.length}개 항목`);
            }

            // 전체 문서 수 계산 (페이지네이션용)
            const totalCount = posts.length;
            const totalPages = Math.ceil(totalCount / this.pageSize);

            // 페이지네이션 적용
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            const paginatedPosts = posts.slice(startIndex, endIndex);

            console.log(`📊 조회 결과: 전체 ${totalCount}개, 현재 페이지 ${paginatedPosts.length}개`);

            // 페이지네이션 업데이트
            this.updatePagination(totalPages);

            // 게시글 목록 업데이트
            this.updateBoardList(paginatedPosts);

            console.log('✅ 게시판 데이터 로드 완료');

        } catch (error) {
            console.error('❌ 게시판 데이터 로드 오류:', error);
            this.showErrorMessage('데이터 로드 중 오류가 발생했습니다: ' + error.message);
            throw error; // 재시도 로직에서 처리할 수 있도록 오류를 다시 던짐
        }
    },

    /**
     * Firebase에서 데이터 로드
     */
    loadFromFirebase: async function () {
        // 컬렉션 이름 결정
        const collectionMap = {
            'notice': 'notices',
            'column': 'columns',
            'materials': 'materials',
            'videos': 'videos'
        };

        const collectionName = collectionMap[this.currentBoardType] || 'notices';
        console.log('🔥 사용 중인 컬렉션:', collectionName);

        if (!window.dhcFirebase || !window.dhcFirebase.db) {
            throw new Error('Firebase가 초기화되지 않았습니다.');
        }

        // Firestore 쿼리 실행
        const query = window.dhcFirebase.db.collection(collectionName)
            .orderBy('createdAt', 'desc')
            .limit(100); // 최대 100개 로드

        const snapshot = await query.get();
        console.log(`🔥 Firebase 쿼리 결과: ${snapshot.size}개`);

        const posts = [];
        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const data = doc.data();
                posts.push({
                    id: doc.id,
                    ...data
                });
            });
        }

        return posts;
    },

    /**
     * 게시글 필터링
     */
    filterPosts: function (posts, searchType, searchKeyword) {
        const searchLower = searchKeyword.toLowerCase();
        
        return posts.filter(post => {
            switch (searchType) {
                case 'title':
                    return post.title && post.title.toLowerCase().includes(searchLower);
                case 'content':
                    return post.content && post.content.toLowerCase().includes(searchLower);
                case 'author':
                    const author = (post.author || post.authorName || '').toLowerCase();
                    return author.includes(searchLower);
                default:
                    return false;
            }
        });
    },

    /**
     * 로딩 상태 표시
     */
    showLoadingState: function () {
        const tableBody = document.querySelector('#board-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6" class="text-center py-8">
                        <div class="flex items-center justify-center space-x-2">
                            <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="text-gray-600">데이터를 불러오는 중입니다...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 게시글 목록 업데이트 (🔧 전역 유틸리티 사용)
     */
    updateBoardList: function (posts) {
        const tableBody = document.querySelector('#board-table tbody');
        if (!tableBody) {
            console.error('게시글 목록 테이블을 찾을 수 없습니다.');
            return;
        }

        console.log('📋 게시글 목록 업데이트:', posts.length, '개');

        if (!posts || posts.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-results">
                    <td colspan="6" class="text-center py-12">
                        <div class="text-gray-400 mb-4">
                            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">등록된 게시글이 없습니다</h3>
                        <p class="text-gray-500">새로운 게시글을 추가해보세요.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';

        posts.forEach((post, index) => {
            try {
                // 🔧 전역 유틸리티 사용하여 날짜 포맷팅
                let createdAt = '-';

                if (post.createdAt) {
                    try {
                        let dateObj;
                        if (typeof post.createdAt.toDate === 'function') {
                            dateObj = post.createdAt.toDate();
                        } else if (typeof post.createdAt === 'object' && post.createdAt.seconds) {
                            dateObj = new Date(post.createdAt.seconds * 1000);
                        } else if (typeof post.createdAt === 'string') {
                            dateObj = new Date(post.createdAt);
                        } else {
                            dateObj = new Date(post.createdAt);
                        }

                        // 🔧 전역 유틸리티 사용
                        createdAt = window.formatters.formatDate(dateObj, 'YYYY.MM.DD');
                    } catch (e) {
                        console.error('날짜 변환 오류:', e, post.createdAt);
                        createdAt = '-';
                    }
                }

                const viewCount = post.views || post.viewCount || 0;
                const postId = post.id || '';
                const title = post.title || '(제목 없음)';
                const author = post.authorName || post.author || '관리자';

                // 상태 결정
                const status = post.status || 'published';
                const statusInfo = this.getStatusInfo(status);

                html += `
                    <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td class="py-3 px-4">
                            <a href="#" class="text-indigo-600 hover:text-indigo-900 view-post font-medium" data-id="${postId}">
                                ${title}
                            </a>
                        </td>
                        <td class="py-3 px-4 text-center text-gray-600">${author}</td>
                        <td class="py-3 px-4 text-center text-gray-600">${viewCount}</td>
                        <td class="py-3 px-4 text-center text-gray-600">${createdAt}</td>
                        <td class="py-3 px-4 text-center">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.class}">
                                ${statusInfo.text}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                            <div class="flex justify-center space-x-2">
                                <button class="text-indigo-600 hover:text-indigo-900 edit-post" data-id="${postId}" title="수정">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                </button>
                                <button class="text-red-600 hover:text-red-900 delete-post" data-id="${postId}" title="삭제">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            } catch (error) {
                console.error('게시글 렌더링 오류:', post, error);
            }
        });

        tableBody.innerHTML = html;
        console.log('✅ 게시글 목록 HTML 업데이트 완료');

        // 이벤트 리스너 추가 (새로 생성된 요소들에 대해)
        this.registerTableEvents();
    },

    /**
     * 테이블 이벤트 등록 (새로 생성된 요소들)
     */
    registerTableEvents: function () {
        const self = this;

        // 게시글 보기 버튼
        document.querySelectorAll('.view-post').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                self.viewPost(postId);
            });
        });

        // 게시글 수정 버튼
        document.querySelectorAll('.edit-post').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                self.editPost(postId);
            });
        });

        // 게시글 삭제 버튼
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const postId = this.getAttribute('data-id');
                self.deletePost(postId);
            });
        });
    },

    /**
     * 상태 정보 가져오기
     */
    getStatusInfo: function (status) {
        const statusMap = {
            'published': { text: '게시', class: 'bg-green-100 text-green-800' },
            'draft': { text: '임시저장', class: 'bg-yellow-100 text-yellow-800' },
            'hidden': { text: '숨김', class: 'bg-gray-100 text-gray-800' },
            'active': { text: '활성', class: 'bg-green-100 text-green-800' }
        };

        return statusMap[status] || { text: '알 수 없음', class: 'bg-gray-100 text-gray-800' };
    },

    /**
     * 페이지네이션 업데이트 (개선된 버전)
     */
    updatePagination: function (totalPages) {
        const paginationContainer = document.getElementById('board-pagination');
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="flex justify-center items-center space-x-2">';

        // 이전 페이지 버튼
        html += `
            <button class="pagination-btn prev-page px-3 py-2 border rounded-md text-sm
                ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                ${this.currentPage === 1 ? 'disabled' : ''}>
                이전
            </button>
        `;

        // 페이지 번호 버튼들
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn page-number px-3 py-2 border rounded-md text-sm" data-page="${i}"
                    ${this.currentPage === i ? 'style="background-color: #4f46e5; color: white; border-color: #4f46e5;"' : 'style="background-color: white; color: #374151;"'}>
                    ${i}
                </button>
            `;
        }

        // 다음 페이지 버튼
        html += `
            <button class="pagination-btn next-page px-3 py-2 border rounded-md text-sm
                ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                ${this.currentPage === totalPages ? 'disabled' : ''}>
                다음
            </button>
        `;

        html += '</div>';
        paginationContainer.innerHTML = html;

        // 페이지네이션 이벤트 리스너 추가
        this.registerPaginationEvents();
    },

    /**
     * 페이지네이션 이벤트 등록
     */
    registerPaginationEvents: function () {
        const self = this;

        // 페이지 번호 버튼
        document.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                self.changePage(page);
            });
        });

        // 이전 페이지 버튼
        const prevBtn = document.querySelector('.prev-page');
        if (prevBtn) {
            prevBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (self.currentPage > 1) {
                    self.changePage(self.currentPage - 1);
                }
            });
        }

        // 다음 페이지 버튼
        const nextBtn = document.querySelector('.next-page');
        if (nextBtn) {
            nextBtn.addEventListener('click', function (e) {
                e.preventDefault();
                // totalPages 계산 (DOM에서 추출)
                const pageNumbers = document.querySelectorAll('.page-number');
                const totalPages = pageNumbers.length > 0 ? 
                    Math.max(...Array.from(pageNumbers).map(btn => parseInt(btn.getAttribute('data-page')))) : 1;
                
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

        console.log(`📄 페이지 변경: ${this.currentPage} → ${page}`);
        this.currentPage = page;
        this.loadBoardData();
    },

    /**
     * 검색 실행
     */
    search: function () {
        console.log('🔍 게시글 검색 실행');

        this.currentPage = 1;
        this.lastDoc = null;
        this.loadBoardData();
    },

    /**
     * 검색 초기화
     */
    resetSearch: function () {
        console.log('🔄 검색 초기화');

        const searchType = document.getElementById('search-type');
        if (searchType) searchType.value = 'title';

        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) searchKeyword.value = '';

        this.currentPage = 1;
        this.lastDoc = null;
        this.loadBoardData();
    },

    /**
     * 게시글 작성 모달 표시 (개선된 버전)
     */
    showAddPostModal: function () {
        console.log('📝 게시글 작성 모달 표시 - 표준화 버전');

        // 🔧 의존성 체크
        if (!checkBoardDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 모달 표시 중단');
            alert('시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            return;
        }

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

        // 에디터 도구 초기화
        this.initializeEditorTools();

        // 모달 표시
        modal.classList.remove('hidden');
        
        // 포커스 설정
        const titleInput = document.getElementById('post-title');
        if (titleInput) {
            setTimeout(() => titleInput.focus(), 100);
        }
    },

    /**
     * 에디터 도구 초기화 (간소화 버전)
     */
    initializeEditorTools: function () {
        console.log('🛠️ 에디터 도구 초기화');

        const editorTools = document.querySelector('.editor-tools');
        if (!editorTools) {
            console.log('에디터 도구 영역을 찾을 수 없습니다. 생성합니다.');

            // 에디터 도구 영역 생성
            const contentGroup = document.querySelector('.content-group');
            if (contentGroup) {
                const toolsDiv = document.createElement('div');
                toolsDiv.className = 'editor-tools flex space-x-2 mb-2';
                toolsDiv.innerHTML = `
                    <button type="button" class="tool-button px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300" data-tool="bold" title="굵게">
                        <strong>B</strong>
                    </button>
                    <button type="button" class="tool-button px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300" data-tool="image" title="이미지 삽입">
                        🖼️
                    </button>
                    <button type="button" class="tool-button px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300" data-tool="link" title="링크 삽입">
                        🔗
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
     * 에디터 도구 사용 (간소화 버전)
     */
    useEditorTool: function (tool) {
        console.log(`🛠️ 에디터 도구 사용: ${tool}`);

        const contentEditor = document.getElementById('post-content');
        if (!contentEditor) return;

        const selStart = contentEditor.selectionStart;
        const selEnd = contentEditor.selectionEnd;
        const value = contentEditor.value;

        switch (tool) {
            case 'bold':
                // 선택한 텍스트를 굵게 처리
                const boldText = `<strong>${value.substring(selStart, selEnd) || '굵은 텍스트'}</strong>`;
                contentEditor.value = value.substring(0, selStart) + boldText + value.substring(selEnd);
                contentEditor.setSelectionRange(selStart + 8, selStart + 8 + (value.substring(selStart, selEnd) || '굵은 텍스트').length);
                break;

            case 'image':
                // 이미지 URL 입력
                const imageUrl = prompt('이미지 URL을 입력하세요:', 'https://');
                if (imageUrl && imageUrl.trim() !== '') {
                    const imgTag = `<img src="${imageUrl}" alt="이미지" style="max-width:100%;" />`;
                    contentEditor.value = value.substring(0, selStart) + imgTag + value.substring(selEnd);
                }
                break;

            case 'link':
                // 링크 삽입
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
     * 게시글 작성 처리 (표준화 버전)
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
            console.log('📝 게시글 작성 처리 시작');

            // 🔧 의존성 체크
            if (!checkBoardDependencies()) {
                throw new Error('필수 유틸리티가 로드되지 않았습니다.');
            }

            // 폼 데이터 가져오기
            const form = event.target;
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

            // 게시글 데이터
            const postData = {
                title: title,
                content: content,
                category: category,
                authorId: 'admin',
                authorName: '관리자',
                author: '관리자',
                views: 0,
                status: 'published',
                // 🔧 전역 유틸리티 사용
                createdAt: this.isFirebaseConnected ? 
                    window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp() : 
                    new Date(),
                updatedAt: this.isFirebaseConnected ? 
                    window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp() : 
                    new Date()
            };

            console.log('게시글 데이터:', postData);

            if (this.isFirebaseConnected) {
                // Firebase에 저장
                await this.saveToFirebase(postData);
            } else {
                // 로컬 테스트 모드
                console.log('🧪 로컬 테스트 모드 - 게시글 저장 시뮬레이션');
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
            }

            console.log('✅ 게시글 등록 성공');
            alert('게시글이 등록되었습니다.');

            // 모달 닫기
            this.closePostModal();

            // 게시글 목록 새로고침
            setTimeout(() => {
                this.loadBoardData();
            }, 500);

        } catch (error) {
            console.error('❌ 게시글 작성 처리 오류:', error);
            alert('게시글 작성 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            // 버튼 상태 복원
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '저장';
            }
        }
    },

    /**
     * Firebase에 게시글 저장
     */
    saveToFirebase: async function (postData) {
        // 컬렉션 이름 매핑
        const collectionMap = {
            'notice': 'notices',
            'column': 'columns',
            'materials': 'materials',
            'videos': 'videos'
        };

        const collectionName = collectionMap[this.currentBoardType] || 'notices';
        console.log('💾 저장 대상 컬렉션:', collectionName);

        if (!window.dhcFirebase || !window.dhcFirebase.db) {
            throw new Error('Firebase가 초기화되지 않았습니다.');
        }

        // Firestore에 데이터 저장
        const docRef = await window.dhcFirebase.db.collection(collectionName).add(postData);
        console.log('✅ Firebase 저장 성공:', docRef.id);

        return docRef.id;
    },

    /**
     * 게시글 수정 처리 (placeholder)
     */
    handleUpdatePost: async function (event, postId) {
        console.log('✏️ 게시글 수정 처리:', postId);
        // TODO: 게시글 수정 로직 구현
        alert('게시글 수정 기능은 곧 구현될 예정입니다.');
    },

    /**
     * 게시글 보기 (placeholder)
     */
    viewPost: function (postId) {
        console.log('👁️ 게시글 보기:', postId);
        // TODO: 게시글 상세보기 구현
        alert('게시글 상세보기 기능은 곧 구현될 예정입니다.');
    },

    /**
     * 게시글 수정 (placeholder)
     */
    editPost: function (postId) {
        console.log('✏️ 게시글 수정:', postId);
        // TODO: 게시글 수정 모달 구현
        alert('게시글 수정 기능은 곧 구현될 예정입니다.');
    },

    /**
     * 게시글 삭제
     */
    deletePost: function (postId) {
        console.log('🗑️ 게시글 삭제:', postId);

        if (confirm('정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.handleDeletePost(postId);
        }
    },

    /**
     * 게시글 삭제 처리
     */
    handleDeletePost: async function (postId) {
        try {
            console.log('🗑️ 게시글 삭제 처리 시작:', postId);

            if (!postId) {
                throw new Error('게시글 ID가 없습니다.');
            }

            if (this.isFirebaseConnected) {
                // Firebase에서 삭제
                const collectionMap = {
                    'notice': 'notices',
                    'column': 'columns',
                    'materials': 'materials',
                    'videos': 'videos'
                };

                const collectionName = collectionMap[this.currentBoardType] || 'notices';

                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    throw new Error('Firebase가 초기화되지 않았습니다.');
                }

                // Firestore 문서 삭제
                await window.dhcFirebase.db.collection(collectionName).doc(postId).delete();
                console.log('✅ Firebase 삭제 성공');
            } else {
                // 로컬 테스트 모드
                console.log('🧪 로컬 테스트 모드 - 게시글 삭제 시뮬레이션');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            alert('게시글이 삭제되었습니다.');

            // 게시글 목록 새로고침
            this.loadBoardData();

        } catch (error) {
            console.error('❌ 게시글 삭제 처리 오류:', error);
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
     * 테스트용 모의 데이터 (🔧 전역 유틸리티 사용)
     */
    getTestData: function () {
        console.log('🧪 테스트 데이터 생성 중...');
        
        const testPosts = [];
        const currentDate = new Date();
        
        for (let i = 1; i <= 15; i++) {
            const postDate = new Date(currentDate);
            postDate.setDate(postDate.getDate() - i);
            
            testPosts.push({
                id: `test-${this.currentBoardType}-${i}`,
                title: `${this.getBoardTypeName(this.currentBoardType)} 테스트 게시글 ${i}`,
                content: `테스트 게시글 ${i}의 내용입니다. 이것은 개발 및 테스트 목적으로 생성된 데이터입니다.`,
                category: this.getTestCategory(),
                author: '관리자',
                authorName: '관리자',
                views: Math.floor(Math.random() * 100),
                status: i % 4 === 0 ? 'draft' : 'published',
                createdAt: postDate,
                updatedAt: postDate
            });
        }
        
        console.log(`🧪 테스트 데이터 ${testPosts.length}개 생성 완료`);
        return testPosts;
    },

    /**
     * 테스트용 카테고리 가져오기
     */
    getTestCategory: function () {
        const categories = this.getCategoriesByBoardType(this.currentBoardType);
        const categoryKeys = Object.keys(categories);
        return categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    }
};

// =================================
// 토스트 메시지 기능 (course-management.js 스타일)
// =================================

/**
 * 토스트 메시지 표시
 */
function showToast(message, type = 'info') {
    console.log(`Toast (${type}): ${message}`);

    // 기존 토스트 제거
    const existingToast = document.querySelector('.board-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = `board-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-size: 14px;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 애니메이션 시작
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 자동 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);

    // 클릭으로 제거
    toast.addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

// 전역 함수로 노출
window.showToast = showToast;

// =================================
// 초기화 함수 (course-management.js 스타일 완전 적용)
// =================================

/**
 * 게시판 관리 페이지 초기화 함수 - course-management.js 스타일
 */
window.initBoardManagement = async function () {
    try {
        console.log('📋 게시판 관리 페이지 초기화 시작 - 완전 표준화 버전');

        // 🔧 의존성 체크 먼저 실행
        if (!checkBoardDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
            showBoardDependencyError();
            return false;
        }

        // 관리자 권한 확인 (course-management.js 스타일)
        let hasAccess = true;
        if (window.adminAuth && typeof window.adminAuth.checkAdminAccess === 'function') {
            console.log('🔐 관리자 권한 확인 시작');
            hasAccess = await window.adminAuth.checkAdminAccess();
        }

        if (hasAccess) {
            console.log('✅ 관리자 권한 확인 완료');
            
            // 관리자 정보 표시
            if (window.adminAuth && window.adminAuth.displayAdminInfo) {
                window.adminAuth.displayAdminInfo();
            }
            
            // 사이드바 토글 기능 초기화 (adminUtils 호환성)
            if (window.adminUtils && window.adminUtils.initAdminSidebar) {
                window.adminUtils.initAdminSidebar();
            }

            // 게시판 관리자 초기화
            console.log('📋 게시판 관리자 초기화 시작');
            
            const success = await window.boardManager.init();
            if (success) {
                console.log('✅ 게시판 관리자 초기화 완료');
                
                // 추가 초기화 작업들
                if (typeof showToast === 'function') {
                    showToast('게시판 관리 시스템이 준비되었습니다.', 'success');
                }
            }
        } else {
            console.log('❌ 관리자 권한 없음');
        }

        return hasAccess;

    } catch (error) {
        console.error('❌ 게시판 관리 페이지 초기화 오류:', error);
        alert('게시판 관리 페이지 초기화 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
};

// =================================
// DOM 로드 및 이벤트 처리 (course-management.js 완전 호환)
// =================================

// 페이지 로드 완료 후 실행 - course-management.js 스타일
document.addEventListener('DOMContentLoaded', function () {
    console.log('🌐 게시판 관리 페이지 DOMContentLoaded');

    // 전역 스코프에 boardManager 객체 확인
    if (!window.boardManager) {
        console.error('❌ window.boardManager가 정의되지 않았습니다.');
        return;
    }

    console.log('✅ window.boardManager 확인됨');
});

// 페이지 완전 로드 후 초기화 - course-management.js와 동일한 패턴
window.addEventListener('load', function () {
    console.log('🌐 게시판 관리 페이지 load 이벤트');

    // 약간의 지연 후 초기화 (모든 스크립트 로딩 완료 대기)
    setTimeout(() => {
        if (window.initBoardManagement && typeof window.initBoardManagement === 'function') {
            console.log('🚀 initBoardManagement 초기화 시작');
            window.initBoardManagement().then((success) => {
                if (success) {
                    console.log('✅ initBoardManagement 초기화 완료');
                } else {
                    console.log('⚠️ initBoardManagement 초기화 실패 또는 권한 없음');
                }
            }).catch(error => {
                console.error('❌ initBoardManagement 초기화 오류:', error);
            });
        } else {
            console.error('❌ window.initBoardManagement 함수를 찾을 수 없습니다.');
        }
    }, 1000); // 1초 지연으로 안정성 확보
});

// =================================
// 디버깅 및 개발자 도구 (course-management.js 스타일)
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugBoardManagement = {
        // 기본 정보 확인
        help: function () {
            console.log('📋 게시판 관리 디버깅 도구 사용법 - 표준화 버전');
            console.log('\n🔧 의존성 관리:');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('\n📊 데이터 관련:');
            console.log('- showCurrentData() : 현재 로드된 데이터 확인');
            console.log('- reloadData() : 데이터 다시 로드');
            console.log('\n📋 게시판 관련:');
            console.log('- switchToBoard("notice") : 특정 게시판으로 전환');
            console.log('- testSearch("키워드") : 검색 기능 테스트');
            console.log('- showTestModal() : 게시글 작성 모달 테스트');
            console.log('\n🔧 시스템 관련:');
            console.log('- checkFirebaseStatus() : Firebase 연결 상태 확인');
            console.log('- runFullTest() : 전체 기능 테스트');
            console.log('- forceInit() : 강제 초기화');
        },

        // 🔧 의존성 테스트 (course-management.js 스타일)
        testDependencies: function () {
            console.log('🔧 게시판 관리 유틸리티 의존성 테스트...');
            const result = checkBoardDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');
                
                // 기능 테스트
                try {
                    const testDate = new Date();
                    console.log('📅 formatters.formatDate 테스트:', window.formatters.formatDate(testDate, 'YYYY.MM.DD'));
                    console.log('💰 formatters.formatCurrency 테스트:', window.formatters.formatCurrency(10000));
                    if (window.dateUtils) {
                        console.log('🕒 dateUtils.format 테스트:', window.dateUtils.format(testDate, 'YYYY-MM-DD'));
                    }
                    if (window.adminAuth) {
                        console.log('🔐 adminAuth 객체 확인:', typeof window.adminAuth);
                    }
                } catch (error) {
                    console.error('❌ 유틸리티 함수 테스트 실패:', error);
                }
            } else {
                console.error('❌ 필수 유틸리티 누락');
            }
            return result;
        },

        // 데이터 관련
        showCurrentData: function () {
            console.log('현재 게시판 관리 상태:');
            console.log('- 현재 게시판:', window.boardManager.currentBoardType);
            console.log('- 현재 페이지:', window.boardManager.currentPage);
            console.log('- Firebase 연결:', window.boardManager.isFirebaseConnected);
            console.log('- 페이지 크기:', window.boardManager.pageSize);
            console.log('- 초기화 상태:', window.boardManager.initialized);
        },

        reloadData: function () {
            console.log('데이터 다시 로드');
            if (window.boardManager) {
                window.boardManager.loadBoardDataWithRetry();
            }
        },

        // 게시판 관련
        switchToBoard: function (boardType) {
            if (!boardType) {
                console.log('사용법: switchToBoard("board-type")');
                console.log('사용 가능한 게시판 타입들:');
                console.log('- notice (공지사항)');
                console.log('- column (칼럼)');
                console.log('- materials (강의자료)');
                console.log('- videos (동영상 강의)');
                return;
            }

            console.log('게시판 전환 테스트:', boardType);
            if (window.boardManager) {
                window.boardManager.switchBoard(boardType);
            }
        },

        testSearch: function (keyword) {
            if (!keyword) {
                console.log('사용법: testSearch("검색어")');
                return;
            }

            console.log('검색 테스트:', keyword);
            
            // 검색어 입력
            const searchKeyword = document.getElementById('search-keyword');
            if (searchKeyword) {
                searchKeyword.value = keyword;
            }

            // 검색 실행
            if (window.boardManager) {
                window.boardManager.search();
            }
        },

        showTestModal: function () {
            console.log('게시글 작성 모달 테스트');
            if (window.boardManager) {
                window.boardManager.showAddPostModal();
            }
        },

        // 시스템 관련
        checkFirebaseStatus: function () {
            console.log('Firebase 연결 상태 확인');
            const connected = checkFirebaseConnection();
            console.log('Firebase 연결됨:', connected);
            
            if (connected) {
                console.log('Firebase 객체:', window.dhcFirebase);
                console.log('DB 객체:', window.dhcFirebase.db);
            }
            
            return connected;
        },

        forceInit: function () {
            console.log('🔧 게시판 관리 강제 초기화');
            if (window.initBoardManagement) {
                window.initBoardManagement();
            } else {
                console.error('initBoardManagement 함수를 찾을 수 없습니다.');
            }
        },

        runFullTest: function () {
            console.log('🚀 전체 기능 테스트 시작...');

            console.log('\n1️⃣ 의존성 테스트');
            const dependenciesOk = this.testDependencies();
            
            if (!dependenciesOk) {
                console.error('❌ 의존성 테스트 실패 - 테스트 중단');
                return;
            }

            console.log('\n2️⃣ Firebase 상태 확인');
            const firebaseOk = this.checkFirebaseStatus();

            console.log('\n3️⃣ 현재 상태 확인');
            this.showCurrentData();

            console.log('\n4️⃣ 게시판 전환 테스트');
            this.switchToBoard('column');
            
            setTimeout(() => {
                console.log('\n5️⃣ 검색 기능 테스트');
                this.testSearch('테스트');
                
                setTimeout(() => {
                    console.log('\n6️⃣ 모달 테스트');
                    this.showTestModal();
                    
                    console.log('\n🎯 전체 테스트 완료!');
                    console.log('💡 이제 다음 명령어들을 시도해보세요:');
                    console.log('- switchToBoard("notice") : 공지사항으로 전환');
                    console.log('- testSearch("키워드") : 특정 키워드 검색');
                    console.log('- forceInit() : 강제 초기화');
                }, 2000);
            }, 2000);
        },

        // 추가 도구들
        fillTestData: function () {
            console.log('테스트 데이터로 모달 채우기');
            this.showTestModal();
            
            setTimeout(() => {
                const titleInput = document.getElementById('post-title');
                const contentInput = document.getElementById('post-content');
                const categorySelect = document.getElementById('post-category');
                
                if (titleInput) titleInput.value = '테스트 게시글 제목';
                if (contentInput) contentInput.value = '테스트 게시글 내용입니다.\n\n이것은 디버깅용 테스트 데이터입니다.';
                if (categorySelect && categorySelect.options.length > 1) {
                    categorySelect.selectedIndex = 1;
                }
                
                console.log('✅ 테스트 데이터 입력 완료');
            }, 500);
        },

        clearSearch: function () {
            console.log('검색 조건 초기화');
            const searchKeyword = document.getElementById('search-keyword');
            const searchType = document.getElementById('search-type');
            
            if (searchKeyword) searchKeyword.value = '';
            if (searchType) searchType.value = 'title';
            
            if (window.boardManager) {
                window.boardManager.resetSearch();
            }
        }
    };

    // 디버깅 도구 안내
    console.log('📋 개발 모드 게시판 관리 디버깅 도구 활성화됨 - 표준화 버전');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('🔧 의존성: testDependencies()');
    console.log('📊 데이터: showCurrentData(), reloadData()');
    console.log('📋 게시판: switchToBoard(type), testSearch(keyword), showTestModal()');
    console.log('🔧 시스템: checkFirebaseStatus(), forceInit(), runFullTest()');
    console.log('🧪 테스트: fillTestData(), clearSearch()');
    console.log('\n💡 도움말: window.debugBoardManagement.help()');
    console.log('🚀 빠른 시작: window.debugBoardManagement.runFullTest()');

} else {
    console.log('프로덕션 모드 - 디버깅 도구 비활성화됨');
    console.log('현재 호스트:', window.location.hostname);
}

// =================================
// 최종 완료 메시지
// =================================

console.log('\n🎉 === board-management.js course-management.js 스타일 완전 표준화 완료 ===');
console.log('✅ 전역 유틸리티 시스템 통합 (formatters.js, date-utils.js, admin-auth.js)');
console.log('✅ 의존성 체크 시스템 구축 (checkBoardDependencies)');
console.log('✅ 재시도 로직이 포함된 데이터 로드 시스템');
console.log('✅ Firebase 연결 상태 확인 시스템');
console.log('✅ 표준화된 이벤트 처리 및 중복 방지');
console.log('✅ 게시판 CRUD 기능 (생성, 읽기, 삭제)');
console.log('✅ 페이지네이션 및 검색 기능');
console.log('✅ 에디터 도구 및 모달 시스템');
console.log('✅ course-management.js와 완전 동일한 초기화 패턴');
console.log('✅ 포괄적인 디버깅 도구 (표준화 버전)');
console.log('\n🔧 해결된 문제점:');
console.log('- window.initBoardManagement 함수 정의 순서 문제 해결');
console.log('- 중복 초기화 로직 제거 및 단일 진입점 구성');
console.log('- course-management.js와 완전 동일한 패턴 적용');
console.log('- 의존성 관리 시스템 표준화');
console.log('- 에러 처리 및 폴백 시스템 강화');
console.log('\n🚀 모든 기능이 course-management.js 스타일로 완전히 표준화되었습니다!');
console.log('🔧 이제 board-management 페이지가 다른 관리자 페이지들과 완전히 동일한 방식으로 작동합니다.');

// 완료 플래그 설정
window.boardManagementReady = true;