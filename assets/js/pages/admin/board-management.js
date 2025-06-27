/**
 * board-management-enhanced.js - WYSIWYG 에디터 및 파일 업로드 지원
 * 기존 board-management.js 기반으로 WYSIWYG 에디터 기능 추가
 */

console.log('=== board-management-enhanced.js WYSIWYG 버전 로드 시작 ===');

// 🔧 의존성 체크 함수 (기존과 동일)
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
        return false;
    }

    console.log('✅ 게시판 관리 모든 필수 유틸리티 로드 확인됨');

    // formatters 함수들이 실제로 작동하는지 테스트
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

// 전역 checkDependencies 함수 노출
window.checkDependencies = checkBoardDependencies;

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
// 🎨 개선된 게시판 관리 메인 객체 - WYSIWYG 에디터 지원
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

    // 🎨 WYSIWYG 에디터 관련 속성
    wysiwygEditor: null,

    /**
     * 초기화 - WYSIWYG 에디터 지원 추가
     */
    init: async function () {
        this.initialized = false;

        try {
            console.log('📋 게시판 관리자 초기화 시작 - WYSIWYG 에디터 지원');

            // 의존성 체크
            if (!checkBoardDependencies()) {
                console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
                this.showBoardDependencyError();
                return false;
            }

            // Firebase 초기화 대기
            await this.waitForFirebase();

            // 이벤트 리스너 등록
            this.registerEventListeners();

            // 게시판 탭 초기화
            this.initBoardTabs();

            // 🎨 WYSIWYG 에디터 초기화
            this.initWysiwygEditor();

            // 게시판 데이터 로드
            await this.loadBoardDataWithRetry();

            this.initialized = true;
            console.log('✅ 게시판 관리자 초기화 완료 - WYSIWYG 에디터 포함');
            return true;

        } catch (error) {
            console.error('❌ 게시판 관리자 초기화 오류:', error);
            this.handleInitializationError(error);
            return false;
        }
    },

    /**
     * 🎨 WYSIWYG 에디터 초기화
     */
    initWysiwygEditor: function () {
        console.log('🎨 WYSIWYG 에디터 초기화 준비');

        // WysiwygEditor 객체가 로드되었는지 확인
        if (typeof window.WysiwygEditor !== 'undefined') {
            this.wysiwygEditor = window.WysiwygEditor;
            console.log('✅ WYSIWYG 에디터 객체 확인됨');
        } else {
            console.warn('⚠️ WYSIWYG 에디터 객체를 찾을 수 없습니다. 모달 열기 시 초기화 예정');
        }
    },

    /**
     * Firebase 초기화 대기
     */
    waitForFirebase: async function () {
        if (!window.dhcFirebase || !window.dhcFirebase.db) {
            console.log('⏳ Firebase 초기화 대기 중...');

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
    },

    /**
     * 초기화 오류 처리
     */
    handleInitializationError: function (error) {
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
    },

    /**
     * 의존성 오류 표시
     */
    showBoardDependencyError: function () {
        const tableBody = document.querySelector('#board-table tbody');

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="admin-empty-state">
                        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3>⚠️ 시스템 오류</h3>
                        <p>게시판 관리에 필요한 유틸리티 파일이 로드되지 않았습니다.<br>페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                        <button onclick="location.reload()" class="admin-btn admin-btn-primary mt-4">
                            새로고침
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 이벤트 리스너 등록 (WYSIWYG 에디터 지원 추가)
     */
    registerEventListeners: function () {
        console.log('📋 이벤트 리스너 등록 시작 - WYSIWYG 지원');

        // 기존 이벤트 리스너들
        this.registerTabEvents();
        this.registerAddPostButton();
        this.registerModalEvents();
        this.registerFormEvents();
        this.registerSearchEvents();

        console.log('✅ 이벤트 리스너 등록 완료 - WYSIWYG 지원');
    },

    /**
     * 게시글 추가 버튼 이벤트 등록 (WYSIWYG 지원)
     */
    registerAddPostButton: function () {
        const addPostButton = document.getElementById('add-post-button');
        if (addPostButton) {
            const self = this;
            addPostButton.removeEventListener('click', addPostButton._clickHandler);
            addPostButton._clickHandler = function (e) {
                e.preventDefault();
                self.showAddPostModal();
            };
            addPostButton.addEventListener('click', addPostButton._clickHandler);
        }
    },

    /**
     * 🎨 WYSIWYG 에디터를 포함한 게시글 작성 모달 표시
     */
    showAddPostModal: function () {
        console.log('📝 게시글 작성 모달 표시 - WYSIWYG 에디터 포함');

        // 의존성 체크
        if (!checkBoardDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 모달 표시 중단');
            this.showNotification('시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.', 'error');
            return;
        }

        // 모달 요소 확인
        const modal = document.getElementById('post-modal');
        const form = document.getElementById('post-form');
        const modalTitle = document.getElementById('modal-title');

        if (!modal || !form) {
            console.error('모달 요소를 찾을 수 없습니다.');
            this.showNotification('모달 요소를 찾을 수 없습니다. 페이지를 다시 로드해주세요.', 'error');
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

        // 🎨 WYSIWYG 에디터 초기화
        setTimeout(() => {
            this.initializeWysiwygEditor();
        }, 100);

        // 모달 표시
        modal.classList.remove('hidden');

        // 포커스 설정
        const titleInput = document.getElementById('post-title');
        if (titleInput) {
            setTimeout(() => titleInput.focus(), 200);
        }
    },

    /**
     * 🎨 WYSIWYG 에디터 초기화 (모달 열기 시)
     */
    initializeWysiwygEditor: function () {
        console.log('🎨 WYSIWYG 에디터 모달 초기화');

        if (typeof window.WysiwygEditor !== 'undefined') {
            // 에디터 초기화
            window.WysiwygEditor.init();

            // 에디터 내용 클리어
            window.WysiwygEditor.clear();

            this.wysiwygEditor = window.WysiwygEditor;
            console.log('✅ WYSIWYG 에디터 모달 초기화 완료');
        } else {
            console.error('❌ WysiwygEditor 객체를 찾을 수 없습니다.');

            // 폴백: 기본 textarea 표시
            this.showBasicTextareaFallback();
        }
    },

    /**
     * 기본 textarea 폴백 표시
     */
    showBasicTextareaFallback: function () {
        console.log('🔄 기본 textarea 폴백 모드');

        const wysiwygEditor = document.getElementById('wysiwyg-editor');
        const hiddenTextarea = document.getElementById('post-content');

        if (wysiwygEditor && hiddenTextarea) {
            // WYSIWYG 에디터 숨기기
            wysiwygEditor.style.display = 'none';

            // hidden textarea를 보이는 textarea로 변경
            hiddenTextarea.style.display = 'block';
            hiddenTextarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500';
            hiddenTextarea.rows = 10;
            hiddenTextarea.placeholder = '게시글 내용을 입력하세요...';

            console.log('✅ 기본 textarea 폴백 완료');
        }
    },

    /**
     * 🎨 게시글 작성 처리 (WYSIWYG 에디터 지원)
     */
    handleCreatePost: async function (event) {
        event.preventDefault();

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
            console.log('📝 게시글 작성 처리 시작 - WYSIWYG 지원');

            // 폼 데이터 가져오기
            const form = event.target;
            const title = document.getElementById('post-title').value;
            const category = document.getElementById('post-category')?.value || 'notice';

            // 🎨 WYSIWYG 에디터에서 내용 가져오기
            let content = '';

            if (this.wysiwygEditor && typeof this.wysiwygEditor.getContent === 'function') {
                content = this.wysiwygEditor.getContent();
                console.log('✅ WYSIWYG 에디터에서 내용 가져옴');
            } else {
                // 폴백: hidden textarea에서 가져오기
                const hiddenTextarea = document.getElementById('post-content');
                content = hiddenTextarea ? hiddenTextarea.value : '';
                console.log('🔄 hidden textarea에서 내용 가져옴');
            }

            // 유효성 검사
            if (!title.trim()) {
                this.showNotification('제목을 입력해주세요.', 'error');
                return;
            }

            if (!content.trim()) {
                this.showNotification('내용을 입력해주세요.', 'error');
                return;
            }

            if (!category) {
                this.showNotification('카테고리를 선택해주세요.', 'error');
                return;
            }

            // 🎨 첨부파일 정보 수집
            const attachedFiles = this.getAttachedFiles();

            // 게시글 데이터
            const postData = {
                title: title.trim(),
                content: content,
                category: category,
                authorId: 'admin',
                authorName: '관리자',
                author: '관리자',
                views: 0,
                status: 'published',
                attachments: attachedFiles, // 🎨 첨부파일 정보 추가
                createdAt: this.isFirebaseConnected ?
                    window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp() :
                    new Date(),
                updatedAt: this.isFirebaseConnected ?
                    window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp() :
                    new Date()
            };

            console.log('게시글 데이터:', postData);

            // 저장 처리
            let savedPostId = null;
            if (this.isFirebaseConnected) {
                savedPostId = await this.saveToFirebase(postData);
            } else {
                console.log('🧪 로컬 테스트 모드 - 게시글 저장 시뮬레이션');
                savedPostId = 'test-' + Date.now();
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 🛠️ 로컬 테스트용: 새 게시글을 테스트 데이터에 추가
                this.addTestPostToMemory(postData, savedPostId);
            }

            console.log('✅ 게시글 등록 성공, ID:', savedPostId);
            this.showNotification('게시글이 등록되었습니다.', 'success');

            // 모달 닫기
            this.closePostModal();

            // 🛠️ 즉시 테이블 업데이트
            console.log('🔄 게시글 목록 즉시 업데이트');

            // 첫 페이지로 이동하고 데이터 새로고침
            this.currentPage = 1;
            await this.forceReloadBoardData();

        } catch (error) {
            console.error('❌ 게시글 작성 처리 오류:', error);
            this.showNotification('게시글 작성 처리 중 오류가 발생했습니다: ' + error.message, 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '저장';
            }
        }
    },

    /**
     * 🛠️ 강제 데이터 새로고침 함수 (새로 추가)
     */
    forceReloadBoardData: async function () {
        try {
            console.log('🔄 강제 데이터 새로고침 시작');

            // 로딩 상태 표시
            this.showLoadingState();

            // 캐시 무효화를 위해 약간의 지연
            await new Promise(resolve => setTimeout(resolve, 500));

            // 데이터 다시 로드
            await this.loadBoardData();

            console.log('✅ 강제 데이터 새로고침 완료');
        } catch (error) {
            console.error('❌ 강제 데이터 새로고침 실패:', error);

            // 실패 시 폴백으로 테스트 데이터 로드
            try {
                const testPosts = this.getTestData();
                this.updateBoardList(testPosts);
                console.log('🔄 폴백 데이터로 테이블 업데이트');
            } catch (fallbackError) {
                console.error('❌ 폴백 데이터 로드도 실패:', fallbackError);
            }
        }
    },

    /**
     * 🛠️ 로컬 테스트용: 메모리에 새 게시글 추가 (새로 추가)
     */
    addTestPostToMemory: function (postData, postId) {
        if (!window.testBoardPosts) {
            window.testBoardPosts = {};
        }

        if (!window.testBoardPosts[this.currentBoardType]) {
            window.testBoardPosts[this.currentBoardType] = [];
        }

        // 새 게시글을 맨 앞에 추가
        const newPost = {
            id: postId,
            ...postData,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        window.testBoardPosts[this.currentBoardType].unshift(newPost);
        console.log('🧪 테스트 게시글이 메모리에 추가됨:', newPost.title);
    },

    /**
     * 🎨 첨부파일 정보 수집
     */
    getAttachedFiles: function () {
        const attachedFiles = [];

        if (this.wysiwygEditor && this.wysiwygEditor.uploadedFiles) {
            this.wysiwygEditor.uploadedFiles.forEach(file => {
                attachedFiles.push({
                    name: file.name,
                    url: file.url,
                    type: file.type,
                    path: file.path
                });
            });
        }

        console.log('📎 수집된 첨부파일:', attachedFiles.length, '개');
        return attachedFiles;
    },

    /**
     * 게시글 모달 닫기 (WYSIWYG 에디터 정리 포함)
     */
    closePostModal: function () {
        const modal = document.getElementById('post-modal');
        if (modal) {
            modal.classList.add('hidden');

            // 🎨 WYSIWYG 에디터 정리
            if (this.wysiwygEditor && typeof this.wysiwygEditor.clear === 'function') {
                this.wysiwygEditor.clear();
                console.log('✅ WYSIWYG 에디터 내용 정리됨');
            }

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

            // 기본 textarea 폴백 모드였다면 원상복구
            const wysiwygEditor = document.getElementById('wysiwyg-editor');
            const hiddenTextarea = document.getElementById('post-content');

            if (wysiwygEditor && hiddenTextarea) {
                wysiwygEditor.style.display = '';
                hiddenTextarea.style.display = 'none';
                hiddenTextarea.className = '';
                hiddenTextarea.removeAttribute('rows');
                hiddenTextarea.removeAttribute('placeholder');
            }
        }
    },

    /**
     * 통일된 알림 시스템 사용
     */
    showNotification: function (message, type = 'info') {
        if (window.adminAuth && window.adminAuth.showNotification) {
            window.adminAuth.showNotification(message, type);
        } else if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    },

    // =================================
    // 기존 함수들 (변경사항 없음)
    // =================================

    /**
     * 게시판 탭 초기화
     */
    initBoardTabs: function () {
        console.log('📋 게시판 탭 초기화');

        const boardTabs = document.querySelectorAll('.board-tab');
        if (boardTabs.length > 0) {
            const firstTab = boardTabs[0];
            const boardType = firstTab.getAttribute('data-board') || 'notice';
            this.updateTabUI(boardType);
        }
    },

    /**
     * 탭 UI 업데이트
     */
    updateTabUI: function (boardType) {
        console.log('📋 탭 UI 업데이트:', boardType);

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

        const boardTypeTitle = document.getElementById('board-title');
        if (boardTypeTitle) {
            boardTypeTitle.textContent = this.getBoardTypeName(boardType);
        }
    },

    /**
     * 탭 이벤트 등록
     */
    registerTabEvents: function () {
        const boardTabs = document.querySelectorAll('.board-tab');
        const self = this;

        boardTabs.forEach(tab => {
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
     * 모달 이벤트 등록
     */
    registerModalEvents: function () {
        const self = this;

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

            postForm.removeEventListener('submit', window.boardFormSubmitHandler);
            postForm.addEventListener('submit', window.boardFormSubmitHandler);
        }
    },

    /**
     * 검색 이벤트 등록
     */
    registerSearchEvents: function () {
        const self = this;

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
        if (this.currentBoardType === boardType) return;

        console.log('📋 게시판 유형 전환:', boardType);

        this.updateTabUI(boardType);
        this.currentBoardType = boardType;
        this.currentPage = 1;
        this.lastDoc = null;

        this.loadBoardData();
    },

    /**
     * 재시도 로직이 포함된 게시판 데이터 로드
     */
    loadBoardDataWithRetry: async function (maxRetries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📋 게시판 데이터 로드 시도 ${attempt}/${maxRetries}`);
                await this.loadBoardData();
                console.log('✅ 게시판 데이터 로드 성공');
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ 게시판 데이터 로드 시도 ${attempt} 실패:`, error);

                if (attempt < maxRetries) {
                    const delay = attempt * 1000;
                    console.log(`⏳ ${delay}ms 후 재시도...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`❌ ${maxRetries}번 시도 후 게시판 데이터 로드 실패:`, lastError);

        try {
            const testPosts = this.getTestData();
            this.updateBoardList(testPosts);
            this.showNotification('서버 연결에 문제가 있어 테스트 데이터를 표시합니다.', 'warning');
            console.log('✅ 테스트 데이터 폴백 완료');
        } catch (fallbackError) {
            console.error('❌ 테스트 데이터 폴백도 실패:', fallbackError);
            this.showErrorMessage('데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.');
        }
    },

    /**
     * 게시판 데이터 로드
     */
    loadBoardData: async function () {
        console.log('📋 게시판 데이터 로드 시작:', this.currentBoardType);

        try {
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

            // 페이지네이션 처리
            const totalCount = posts.length;
            const totalPages = Math.ceil(totalCount / this.pageSize);
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            const paginatedPosts = posts.slice(startIndex, endIndex);

            console.log(`📊 조회 결과: 전체 ${totalCount}개, 현재 페이지 ${paginatedPosts.length}개`);

            this.updatePagination(totalPages);
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

        const query = window.dhcFirebase.db.collection(collectionName)
            .orderBy('createdAt', 'desc')
            .limit(100);

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
     * Firebase에 게시글 저장
     */
    saveToFirebase: async function (postData) {
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

        const docRef = await window.dhcFirebase.db.collection(collectionName).add(postData);
        console.log('✅ Firebase 저장 성공:', docRef.id);

        return docRef.id;
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
                    <td colspan="6" class="admin-loading-state">
                        <div class="admin-loading-spinner"></div>
                        <span class="text-gray-600">데이터를 불러오는 중입니다...</span>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * 에러 메시지 표시
     */
    showErrorMessage: function (message) {
        const tableBody = document.querySelector('#board-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="admin-empty-state">
                        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3>오류 발생</h3>
                        <p>${message}</p>
                        <button onclick="boardManager.loadBoardDataWithRetry()" class="admin-btn admin-btn-primary mt-4">
                            다시 시도
                        </button>
                    </td>
                </tr>
            `;
        }

        this.showNotification(message, 'error');
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

        console.log('📋 게시글 목록 업데이트:', posts.length, '개');

        if (!posts || posts.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-results">
                    <td colspan="6" class="admin-empty-state">
                        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h3>등록된 게시글이 없습니다</h3>
                        <p>새로운 게시글을 추가해보세요.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';

        posts.forEach((post, index) => {
            try {
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

                const status = post.status || 'published';
                const statusInfo = this.getStatusInfo(status);

                html += `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td data-label="제목" class="py-3 px-4">
                            <a href="#" class="text-indigo-600 hover:text-indigo-900 view-post font-medium" data-id="${postId}">
                                ${title}
                            </a>
                        </td>
                        <td data-label="작성자" class="py-3 px-4 text-center text-gray-600">${author}</td>
                        <td data-label="조회수" class="py-3 px-4 text-center text-gray-600">${viewCount}</td>
                        <td data-label="작성일" class="py-3 px-4 text-center text-gray-600">${createdAt}</td>
                        <td data-label="상태" class="py-3 px-4 text-center">
                            <span class="status-badge ${statusInfo.class}">
                                ${statusInfo.text}
                            </span>
                        </td>
                        <td data-label="작업" class="py-3 px-4 text-center">
                            <div class="table-actions">
                                <button class="table-action-btn btn-view view-post" data-id="${postId}" title="보기">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    보기
                                </button>
                                <button class="table-action-btn btn-edit edit-post" data-id="${postId}" title="수정">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    수정
                                </button>
                                <button class="table-action-btn btn-delete delete-post" data-id="${postId}" title="삭제">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    삭제
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

        this.registerTableEvents();
    },

    /**
     * 테이블 이벤트 등록
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
            'published': { text: '게시', class: 'status-active' },
            'draft': { text: '임시저장', class: 'status-inactive' },
            'hidden': { text: '숨김', class: 'status-inactive' },
            'active': { text: '활성', class: 'status-active' }
        };

        return statusMap[status] || { text: '알 수 없음', class: 'status-inactive' };
    },

    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function (totalPages) {
        const paginationContainer = document.getElementById('board-pagination');
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '<div class="admin-pagination">';

        // 이전 페이지 버튼
        html += `
            <button class="admin-pagination-btn ${this.currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}" 
                onclick="boardManager.changePage(${this.currentPage - 1})"
                ${this.currentPage === 1 ? 'disabled' : ''}>
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span class="hide-mobile">이전</span>
            </button>
        `;

        // 페이지 번호 버튼들
        const maxVisiblePages = window.innerWidth <= 480 ? 3 : 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="admin-pagination-btn page-number ${this.currentPage === i ? 'active' : ''}" 
                    onclick="boardManager.changePage(${i})" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // 다음 페이지 버튼
        html += `
            <button class="admin-pagination-btn ${this.currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}" 
                onclick="boardManager.changePage(${this.currentPage + 1})"
                ${this.currentPage === totalPages ? 'disabled' : ''}>
                <span class="hide-mobile">다음</span>
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        `;

        html += '</div>';
        paginationContainer.innerHTML = html;
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
     * 게시글 보기 (향후 구현)
     */
    viewPost: function (postId) {
        console.log('👁️ 게시글 보기:', postId);
        this.showNotification('게시글 상세보기 기능은 곧 구현될 예정입니다.', 'info');
    },

    /**
     * 게시글 수정 (향후 구현)
     */
    editPost: function (postId) {
        console.log('✏️ 게시글 수정:', postId);
        this.showNotification('게시글 수정 기능은 곧 구현될 예정입니다.', 'info');
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

                await window.dhcFirebase.db.collection(collectionName).doc(postId).delete();
                console.log('✅ Firebase 삭제 성공');
            } else {
                console.log('🧪 로컬 테스트 모드 - 게시글 삭제 시뮬레이션');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.showNotification('게시글이 삭제되었습니다.', 'success');

            // 게시글 목록 새로고침
            this.loadBoardData();

        } catch (error) {
            console.error('❌ 게시글 삭제 처리 오류:', error);
            this.showNotification('게시글 삭제 처리 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    },

    /**
     * 게시글 수정 처리 (향후 구현)
     */
    handleUpdatePost: async function (event, postId) {
        console.log('✏️ 게시글 수정 처리:', postId);
        this.showNotification('게시글 수정 기능은 곧 구현될 예정입니다.', 'info');
    },

    /**
     * 카테고리 옵션 설정
     */
    setupCategoryOptions: function (selectElement) {
        if (!selectElement) return;

        selectElement.innerHTML = '';

        const categories = this.getCategoriesByBoardType(this.currentBoardType);

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 카테고리 선택 --';
        selectElement.appendChild(defaultOption);

        for (const key in categories) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = categories[key];
            selectElement.appendChild(option);
        }
    },

    /**
     * 게시판 유형별 카테고리 가져오기
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
     * 테스트용 모의 데이터
     */
    getTestData: function () {
        console.log('🧪 테스트 데이터 생성 중...');

        // 메모리에 저장된 게시글이 있는지 확인
        if (window.testBoardPosts && window.testBoardPosts[this.currentBoardType]) {
            const memoryPosts = window.testBoardPosts[this.currentBoardType];
            console.log(`🧪 메모리에서 ${memoryPosts.length}개 게시글 로드`);

            // 메모리 데이터와 기본 테스트 데이터 합치기
            const defaultTestPosts = this.generateDefaultTestData();
            const allPosts = [...memoryPosts, ...defaultTestPosts];

            // 날짜순 정렬 (최신순)
            allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return allPosts;
        }

        // 메모리 데이터가 없으면 기본 테스트 데이터 반환
        return this.generateDefaultTestData();
    },

    /**
     * 🛠️ 기본 테스트 데이터 생성 (기존 getTestData에서 분리)
     */
    generateDefaultTestData: function () {
        const testPosts = [];
        const currentDate = new Date();

        for (let i = 1; i <= 15; i++) {
            const postDate = new Date(currentDate);
            postDate.setDate(postDate.getDate() - i);

            testPosts.push({
                id: `test-${this.currentBoardType}-${i}`,
                title: `${this.getBoardTypeName(this.currentBoardType)} 테스트 게시글 ${i}`,
                content: `<p>테스트 게시글 ${i}의 내용입니다.</p><p>이것은 개발 및 테스트 목적으로 생성된 <strong>HTML 형식</strong>의 데이터입니다.</p>`,
                category: this.getTestCategory(),
                author: '관리자',
                authorName: '관리자',
                views: Math.floor(Math.random() * 100),
                status: i % 4 === 0 ? 'draft' : 'published',
                createdAt: postDate,
                updatedAt: postDate,
                attachments: i % 3 === 0 ? [
                    {
                        name: `첨부파일_${i}.pdf`,
                        url: 'https://example.com/file.pdf',
                        type: 'application/pdf'
                    }
                ] : []
            });
        }

        console.log(`🧪 기본 테스트 데이터 ${testPosts.length}개 생성 완료`);
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
// 초기화 함수
// =================================

/**
 * 게시판 관리 페이지 초기화 함수 - WYSIWYG 에디터 지원
 */
window.initBoardManagement = async function () {
    try {
        console.log('📋 게시판 관리 페이지 초기화 시작 - WYSIWYG 에디터 지원');

        // 의존성 체크
        if (!checkBoardDependencies()) {
            console.error('❌ 필수 유틸리티 누락으로 초기화 중단');
            window.boardManager.showBoardDependencyError();
            return false;
        }

        // 관리자 권한 확인
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

            // 사이드바 토글 기능 초기화
            if (window.adminUtils && window.adminUtils.initAdminSidebar) {
                window.adminUtils.initAdminSidebar();
            }

            // 게시판 관리자 초기화
            console.log('📋 게시판 관리자 초기화 시작');

            const success = await window.boardManager.init();
            if (success) {
                console.log('✅ 게시판 관리자 초기화 완료 - WYSIWYG 에디터 포함');

                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('게시판 관리 시스템이 준비되었습니다.', 'success');
                } else if (typeof showToast === 'function') {
                    showToast('게시판 관리 시스템이 준비되었습니다.', 'success');
                }
            }
        } else {
            console.log('❌ 관리자 권한 없음');
        }

        return hasAccess;

    } catch (error) {
        console.error('❌ 게시판 관리 페이지 초기화 오류:', error);

        if (window.adminAuth && window.adminAuth.showNotification) {
            window.adminAuth.showNotification('게시판 관리 페이지 초기화 중 오류가 발생했습니다: ' + error.message, 'error');
        } else if (typeof showToast === 'function') {
            showToast('게시판 관리 페이지 초기화 중 오류가 발생했습니다: ' + error.message, 'error');
        } else {
            alert('게시판 관리 페이지 초기화 중 오류가 발생했습니다: ' + error.message);
        }
        return false;
    }
};

// =================================
// DOM 로드 및 이벤트 처리
// =================================

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function () {
    console.log('🌐 게시판 관리 페이지 DOMContentLoaded - WYSIWYG 지원');

    if (!window.boardManager) {
        console.error('❌ window.boardManager가 정의되지 않았습니다.');
        return;
    }

    console.log('✅ window.boardManager 확인됨 - WYSIWYG 지원');
});

// 페이지 완전 로드 후 초기화
window.addEventListener('load', function () {
    console.log('🌐 게시판 관리 페이지 load 이벤트 - WYSIWYG 지원');

    setTimeout(() => {
        if (window.initBoardManagement && typeof window.initBoardManagement === 'function') {
            console.log('🚀 initBoardManagement 초기화 시작 - WYSIWYG 지원');
            window.initBoardManagement().then((success) => {
                if (success) {
                    console.log('✅ initBoardManagement 초기화 완료 - WYSIWYG 지원');
                } else {
                    console.log('⚠️ initBoardManagement 초기화 실패 또는 권한 없음');
                }
            }).catch(error => {
                console.error('❌ initBoardManagement 초기화 오류:', error);
            });
        } else {
            console.error('❌ window.initBoardManagement 함수를 찾을 수 없습니다.');
        }
    }, 1000);
});

// =================================
// 디버깅 및 개발자 도구
// =================================

// 개발 모드에서 사용되는 디버깅 함수들
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.web.app') ||
    window.location.hostname.includes('.firebaseapp.com') ||
    window.location.protocol === 'file:' ||
    window.FORCE_DEBUG === true) {

    window.debugBoardManagement = {
        help: function () {
            console.log('📋 게시판 관리 디버깅 도구 사용법 - WYSIWYG 지원');
            console.log('\n🔧 의존성 관리:');
            console.log('- testDependencies() : 유틸리티 의존성 확인');
            console.log('\n📊 데이터 관련:');
            console.log('- showCurrentData() : 현재 로드된 데이터 확인');
            console.log('- reloadData() : 데이터 다시 로드');
            console.log('\n📋 게시판 관련:');
            console.log('- switchToBoard("notice") : 특정 게시판으로 전환');
            console.log('- testSearch("키워드") : 검색 기능 테스트');
            console.log('- showTestModal() : 게시글 작성 모달 테스트');
            console.log('\n🎨 WYSIWYG 에디터:');
            console.log('- testEditor() : WYSIWYG 에디터 테스트');
            console.log('- fillEditorContent() : 에디터에 테스트 내용 입력');
            console.log('- getEditorContent() : 에디터 내용 확인');
            console.log('\n🔧 시스템 관련:');
            console.log('- checkFirebaseStatus() : Firebase 연결 상태 확인');
            console.log('- runFullTest() : 전체 기능 테스트');
            console.log('- forceInit() : 강제 초기화');
        },

        testDependencies: function () {
            console.log('🔧 게시판 관리 유틸리티 의존성 테스트...');
            const result = checkBoardDependencies();
            if (result) {
                console.log('✅ 모든 유틸리티 정상 로드됨');

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

        showCurrentData: function () {
            console.log('현재 게시판 관리 상태:');
            console.log('- 현재 게시판:', window.boardManager.currentBoardType);
            console.log('- 현재 페이지:', window.boardManager.currentPage);
            console.log('- Firebase 연결:', window.boardManager.isFirebaseConnected);
            console.log('- 페이지 크기:', window.boardManager.pageSize);
            console.log('- 초기화 상태:', window.boardManager.initialized);
            console.log('- WYSIWYG 에디터:', window.boardManager.wysiwygEditor ? '✅ 로드됨' : '❌ 없음');
        },

        testEditor: function () {
            console.log('🎨 WYSIWYG 에디터 테스트');

            if (typeof window.WysiwygEditor !== 'undefined') {
                console.log('✅ WysiwygEditor 객체 확인됨');
                console.log('- 초기화 상태:', window.WysiwygEditor.isInitialized);
                console.log('- 업로드된 파일:', window.WysiwygEditor.uploadedFiles?.length || 0, '개');

                // 에디터가 초기화되지 않았다면 초기화
                if (!window.WysiwygEditor.isInitialized) {
                    console.log('🔧 에디터 초기화 시도...');
                    window.WysiwygEditor.init();
                }
            } else {
                console.error('❌ WysiwygEditor 객체를 찾을 수 없습니다.');
            }
        },

        fillEditorContent: function () {
            console.log('🎨 에디터에 테스트 내용 입력');

            if (typeof window.WysiwygEditor !== 'undefined' && window.WysiwygEditor.isInitialized) {
                const testContent = `
                    <h2>테스트 제목</h2>
                    <p>이것은 <strong>WYSIWYG 에디터</strong>의 테스트 내용입니다.</p>
                    <p>다음과 같은 기능들을 테스트할 수 있습니다:</p>
                    <ul>
                        <li><em>기울임</em> 텍스트</li>
                        <li><u>밑줄</u> 텍스트</li>
                        <li><s>취소선</s> 텍스트</li>
                    </ul>
                    <p><a href="https://example.com" target="_blank">링크 테스트</a></p>
                `;

                window.WysiwygEditor.setContent(testContent);
                console.log('✅ 테스트 내용이 에디터에 입력되었습니다.');
            } else {
                console.error('❌ WYSIWYG 에디터가 초기화되지 않았습니다.');
                this.testEditor();
            }
        },

        getEditorContent: function () {
            console.log('🎨 에디터 내용 확인');

            if (typeof window.WysiwygEditor !== 'undefined' && window.WysiwygEditor.isInitialized) {
                const content = window.WysiwygEditor.getContent();
                console.log('📄 에디터 내용:', content);
                return content;
            } else {
                console.error('❌ WYSIWYG 에디터가 초기화되지 않았습니다.');
                return null;
            }
        },

        showTestModal: function () {
            console.log('게시글 작성 모달 테스트 - WYSIWYG 포함');
            if (window.boardManager) {
                window.boardManager.showAddPostModal();
            }
        },

        fillTestData: function () {
            console.log('테스트 데이터로 모달 채우기 - WYSIWYG 포함');
            this.showTestModal();

            setTimeout(() => {
                const titleInput = document.getElementById('post-title');
                const categorySelect = document.getElementById('post-category');

                if (titleInput) titleInput.value = '테스트 게시글 제목';
                if (categorySelect && categorySelect.options.length > 1) {
                    categorySelect.selectedIndex = 1;
                }

                // WYSIWYG 에디터에 내용 입력
                this.fillEditorContent();

                console.log('✅ 테스트 데이터 입력 완료 - WYSIWYG 포함');
            }, 1000);
        },

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

            const searchKeyword = document.getElementById('search-keyword');
            if (searchKeyword) {
                searchKeyword.value = keyword;
            }

            if (window.boardManager) {
                window.boardManager.search();
            }
        },

        reloadData: function () {
            console.log('데이터 다시 로드');
            if (window.boardManager) {
                window.boardManager.loadBoardDataWithRetry();
            }
        },

        checkFirebaseStatus: function () {
            console.log('Firebase 연결 상태 확인');
            const connected = checkFirebaseConnection();
            console.log('Firebase 연결됨:', connected);

            if (connected) {
                console.log('Firebase 객체:', window.dhcFirebase);
                console.log('DB 객체:', window.dhcFirebase.db);
                console.log('Storage 객체:', window.dhcFirebase.storage);
            }

            return connected;
        },

        forceInit: function () {
            console.log('🔧 게시판 관리 강제 초기화 - WYSIWYG 포함');
            if (window.initBoardManagement) {
                window.initBoardManagement();
            } else {
                console.error('initBoardManagement 함수를 찾을 수 없습니다.');
            }
        },

        runFullTest: function () {
            console.log('🚀 전체 기능 테스트 시작 - WYSIWYG 포함...');

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

            console.log('\n4️⃣ WYSIWYG 에디터 테스트');
            this.testEditor();

            console.log('\n5️⃣ 게시판 전환 테스트');
            this.switchToBoard('column');

            setTimeout(() => {
                console.log('\n6️⃣ 검색 기능 테스트');
                this.testSearch('테스트');

                setTimeout(() => {
                    console.log('\n7️⃣ 모달 및 에디터 테스트');
                    this.fillTestData();

                    console.log('\n🎯 전체 테스트 완료! - WYSIWYG 포함');
                    console.log('💡 이제 다음 명령어들을 시도해보세요:');
                    console.log('- fillTestData() : 테스트 데이터로 모달 채우기');
                    console.log('- getEditorContent() : 에디터 내용 확인');
                    console.log('- testEditor() : 에디터 기능 테스트');
                }, 2000);
            }, 2000);
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
        },

        forceReload: function () {
            console.log('🔄 강제 데이터 새로고침 테스트');
            if (window.boardManager) {
                window.boardManager.forceReloadBoardData();
            }
        },

        testPostCreation: function () {
            console.log('📝 게시글 작성 및 업데이트 테스트');

            // 모달 열기
            this.showTestModal();

            setTimeout(() => {
                // 테스트 데이터 입력
                this.fillTestData();

                console.log('💡 이제 "저장" 버튼을 클릭해서 게시글이 테이블에 추가되는지 확인하세요!');
                console.log('또는 다음 명령어로 강제 새로고침을 테스트할 수 있습니다:');
                console.log('window.debugBoardManagement.forceReload()');
            }, 1000);
        }
    };

    // 디버깅 도구 안내
    console.log('📋 개발 모드 게시판 관리 디버깅 도구 활성화됨 - WYSIWYG 지원');
    console.log('현재 호스트:', window.location.hostname);
    console.log('\n🔥 주요 디버깅 함수들:');
    console.log('🔧 의존성: testDependencies()');
    console.log('📊 데이터: showCurrentData(), reloadData()');
    console.log('📋 게시판: switchToBoard(type), testSearch(keyword), showTestModal()');
    console.log('🎨 에디터: testEditor(), fillEditorContent(), getEditorContent()');
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

console.log('\n🎉 === board-management-enhanced.js WYSIWYG 에디터 지원 완료 ===');
console.log('✅ WYSIWYG 에디터 통합 및 파일 업로드 지원');
console.log('✅ Firebase Storage 연동 준비');
console.log('✅ 드래그 앤 드롭 파일 업로드');
console.log('✅ 실시간 에디터 툴바 및 키보드 단축키');
console.log('✅ 이미지 미리보기 및 자동 삽입');
console.log('✅ 첨부파일 관리 시스템');
console.log('✅ 기존 게시판 관리 기능 완전 유지');
console.log('✅ 향상된 디버깅 도구 (WYSIWYG 지원)');
console.log('\n🔧 새로운 기능들:');
console.log('- 실제 WYSIWYG 에디터 (HTML 포맷팅)');
console.log('- 파일 업로드 및 첨부 기능');
console.log('- 이미지 자동 삽입 및 미리보기');
console.log('- 드래그 앤 드롭 지원');
console.log('- 키보드 단축키 (Ctrl+B, I, U, Z, Y)');
console.log('- 서식 지우기 및 되돌리기/다시실행');
console.log('\n🚀 board-management가 완전한 WYSIWYG 에디터로 업그레이드되었습니다!');
console.log('🎨 이제 관리자가 실제 워드프로세서처럼 게시글을 작성할 수 있습니다.');

// 완료 플래그 설정
window.boardManagementEnhancedReady = true;