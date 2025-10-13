/**
 * board.js
 * 게시판 관련 공통 기능 개선 - UI 개선 버전
 */

console.log('=== board.js 파일 로드 시작 ===');

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    'use strict';

    console.log('board.js IIFE 초기화');

    // Firebase와 서비스 준비 대기
    async function waitForServices() {
        console.log('서비스 준비 대기 중...');

        // Firebase가 로드되기를 기다림
        while (!window.firebase || !window.dhcFirebase) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // authService가 로드되기를 기다림
        while (!window.authService) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // dbService가 로드되기를 기다림
        while (!window.dbService) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('모든 서비스 준비 완료');
        return true;
    }

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
        console.log(`권한 확인: ${action}, ${boardType}, ${userId}, ${authorId}`);

        const config = boardConfig[boardType];
        if (!config) {
            console.log('게시판 설정 없음');
            return false;
        }

        const permissions = config.permissions[action];
        if (!permissions) {
            console.log('권한 설정 없음');
            return false;
        }

        // 모든 사용자 허용
        if (permissions.includes('all')) {
            console.log('모든 사용자 허용');
            return true;
        }

        // 로그인하지 않은 사용자
        if (!window.authService || !window.authService.getCurrentUser()) {
            console.log('로그인 안됨');
            return false;
        }

        const user = window.authService.getCurrentUser();
        if (!user) {
            console.log('현재 사용자 없음');
            return false;
        }

        // 관리자는 항상 모든 권한 가짐
        if (user.email === 'gostepexercise@gmail.com') {
            console.log('관리자 권한 확인');
            return true;
        }

        // 특정 역할 확인
        if (permissions.includes(user.role)) {
            console.log(`역할 매치: ${user.role}`);
            return true;
        }

        // 작성자 권한 확인
        if (permissions.includes('author') && userId && authorId && userId === authorId) {
            console.log('작성자 권한 매치');
            return true;
        }

        console.log('권한 없음');
        return false;
    }

    // 카테고리 텍스트 가져오기
    function getCategoryText(boardType, categoryKey) {
        const config = boardConfig[boardType];
        return config && config.categories[categoryKey] ? config.categories[categoryKey] : categoryKey;
    }

    // HTML 요소 ID 가져오기 (게시판 타입별)
    function getElementId(boardType, baseId) {
        switch (boardType) {
            case 'notice':
                return `notice-${baseId}`;
            case 'column':
                return `post-${baseId}`;
            case 'materials':
                return `materials-${baseId}`;
            case 'videos':
                return `videos-${baseId}`;
            default:
                return `post-${baseId}`;
        }
    }

    // 로딩 표시
    function showLoading(element) {
        if (element) {
            element.innerHTML = `
                <tr class="loading-row">
                    <td colspan="6" class="text-center py-8">
                        <div class="loading-spinner inline-block"></div>
                        <span class="ml-2">로딩 중...</span>
                    </td>
                </tr>
            `;
        }
    }

    // 목록 페이지 초기화
    function initListPage() {
        console.log('목록 페이지 초기화');

        const boardType = getBoardType();
        if (!boardType) {
            console.log('게시판 타입 확인 실패');
            // 샘플 데이터로 폴백
            loadSampleData();
            return;
        }

        console.log(`게시판 타입: ${boardType}`);

        let currentPage = 1;
        let lastDoc = null;
        let hasMore = true;
        let searchQuery = '';
        let categoryFilter = '';

        // 샘플 데이터 로드 (Firebase 연동 전 사용)
        function loadSampleData() {
            console.log('샘플 데이터 로드');

            const sampleNotices = [
                {
                    id: 1,
                    category: 'notice',
                    title: '테스트2',
                    authorName: 'gostepexercise@gmail.com',
                    createdAt: { seconds: Date.now() / 1000 - 86400 }, // 1일 전
                    views: 28,
                    attachments: [{ name: 'test.pdf' }]
                },
                {
                    id: 2,
                    category: 'notice',
                    title: '테스트6',
                    authorName: 'gostepexercise@gmail.com',
                    createdAt: { seconds: Date.now() / 1000 - 172800 }, // 2일 전
                    views: 15,
                    attachments: []
                }
            ];

            displayPosts(sampleNotices, true);
            updateTotalCountSample(sampleNotices.length);
        }

        // 게시글 목록 가져오기
        // loadPosts 함수의 try-catch 부분 수정
        async function loadPosts(reset = false) {
            console.log(`게시글 로드: reset=${reset}, currentPage=${currentPage}`);

            const listId = getElementId(boardType, 'list');
            const tbody = document.getElementById(listId);
            if (!tbody) {
                console.log(`게시글 목록 요소 없음: ${listId}`);
                return;
            }

            // 로딩 표시
            showLoading(tbody);

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
                await waitForServices();

                let result;
                if (searchQuery) {
                    result = await dbService.searchDocuments(collection, 'title', searchQuery, options);
                } else {
                    result = await dbService.getPaginatedDocuments(collection, options, lastDoc);
                }

                if (result.success) {
                    displayPosts(result.data, reset);
                    lastDoc = result.lastDoc;
                    hasMore = result.hasMore;
                    updatePagination();
                } else {
                    console.error('게시글 로드 실패:', result.error);
                    loadSampleData();
                }
            } catch (error) {
                console.error('게시글 로드 중 오류:', error);
                loadSampleData();
            } finally {
                // ⭐ 추가: 혹시 모를 경우를 대비해 로딩 제거
                const loadingRow = tbody.querySelector('.loading-row');
                if (loadingRow) {
                    loadingRow.remove();
                }
            }
        }

        // 오류 표시
        function showError(tbody, message) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-8 text-red-500">
                            ${message}
                        </td>
                    </tr>
                `;
            }
        }

        // 게시글 표시 (개선된 버전)
        function displayPosts(posts, reset = false) {
            console.log(`게시글 표시: ${posts.length}개, reset=${reset}`);

            const listId = getElementId(boardType, 'list');
            const tbody = document.getElementById(listId);
            if (!tbody) return;

            // ⭐ 로딩 행 제거 (항상 실행)
            const loadingRow = tbody.querySelector('.loading-row');
            if (loadingRow) {
                loadingRow.remove();
            }

            if (reset) {
                tbody.innerHTML = '';
            }

            if (posts.length === 0 && reset) {
                tbody.innerHTML = `
            <tr class="no-results">
                <td colspan="6" class="text-center py-12">
                    <div class="icon">
                        <svg class="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                    <p class="text-gray-500">다른 검색어로 다시 시도해 보세요.</p>
                </td>
            </tr>
        `;
                return;
            }

            posts.forEach((post, index) => {
                const number = (currentPage - 1) * 10 + index + 1;
                const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('ko-KR') : '';
                const categoryText = getCategoryText(boardType, post.category);

                const row = document.createElement('tr');
                row.className = 'clickable-row';
                row.onclick = () => goToDetail(post.id);

                // 첨부파일 아이콘
                const attachmentIcon = (post.attachments && post.attachments.length > 0) ?
                    '<svg class="attachment-icon inline ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>' : '';

                // 비디오 아이콘 (videos 게시판만)
                const videoIcon = (boardType === 'videos') ?
                    '<svg class="attachment-icon inline ml-1 w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : '';

                row.innerHTML = `
            <td class="col-number">${number}</td>
            <td class="col-category">
                <span class="category-badge ${post.category}">
                    ${categoryText}
                </span>
            </td>
            <td class="col-title">
                <span class="post-title-link">
                    ${post.title}${attachmentIcon}${videoIcon}
                </span>
            </td>
            <td class="col-author hide-mobile">${getAuthorName(post)}</td>
            <td class="col-date hide-mobile">${date}</td>
            <td class="col-views hide-mobile">${post.views || 0}</td>
        `;
                tbody.appendChild(row);
            });
        }

        // 작성자명 가져오기
        function getAuthorName(post) {
            if (boardType === 'videos') {
                return post.instructor || post.authorName || '관리자';
            }
            return post.authorName || '관리자';
        }

        // 상세보기로 이동
        function goToDetail(postId) {
            const baseUrl = window.adjustPath ? window.adjustPath('pages/board/notice/view.html') : 'view.html';
            const boardPath = {
                'notice': 'pages/board/notice/view.html',
                'column': 'pages/board/column/view.html',
                'materials': 'pages/board/materials/view.html',
                'videos': 'pages/board/videos/view.html'
            };

            const viewUrl = window.adjustPath ?
                window.adjustPath(boardPath[boardType] || 'pages/board/notice/view.html') :
                'view.html';

            window.location.href = `${viewUrl}?id=${postId}`;
        }

        // 샘플 데이터용 총 개수 업데이트
        function updateTotalCountSample(count) {
            const totalCount = document.getElementById('total-count');
            if (totalCount) {
                totalCount.textContent = count;
            }
        }

        // 페이지네이션 업데이트
        function updatePagination() {
            const pagination = document.getElementById('pagination');
            if (!pagination) return;

            pagination.innerHTML = '';

            // 이전 페이지 버튼
            if (currentPage > 1) {
                const prevButton = document.createElement('button');
                prevButton.className = 'relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50';
                prevButton.innerHTML = '이전';
                prevButton.onclick = () => {
                    currentPage--;
                    lastDoc = null; // ⭐ 추가
                    loadPosts(true); // ⭐ reset=true로 변경
                };
                pagination.appendChild(prevButton);
            }

            // 페이지 번호
            const pageSpan = document.createElement('span');
            pageSpan.className = 'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-50 text-sm font-medium text-gray-900';
            pageSpan.textContent = `${currentPage} 페이지`;
            pagination.appendChild(pageSpan);

            // 다음 페이지 버튼
            if (hasMore) {
                const nextButton = document.createElement('button');
                nextButton.className = 'relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50';
                nextButton.innerHTML = '다음';
                nextButton.onclick = () => {
                    currentPage++;
                    loadPosts(false); // ⭐ reset=false 명시 (다음 페이지는 lastDoc 유지)
                };
                pagination.appendChild(nextButton);
            }
        }

        // 검색 기능
        function setupSearch() {
            console.log('검색 기능 설정');

            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');
            const categorySelect = document.getElementById('category-filter');

            if (searchButton) {
                searchButton.addEventListener('click', () => {
                    console.log('검색 버튼 클릭');
                    searchQuery = searchInput ? searchInput.value.trim() : '';
                    categoryFilter = categorySelect ? categorySelect.value : '';
                    loadPosts(true);
                });
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        console.log('검색 엔터키 입력');
                        searchQuery = searchInput.value.trim();
                        categoryFilter = categorySelect ? categorySelect.value : '';
                        loadPosts(true);
                    }
                });
            }

            if (categorySelect) {
                categorySelect.addEventListener('change', () => {
                    console.log('카테고리 변경');
                    categoryFilter = categorySelect.value;
                    loadPosts(true);
                });
            }
        }

        // 글쓰기 버튼 숨김 (기존 코드 비활성화)
        function hideWriteButton() {
            console.log('글쓰기 버튼 숨김');

            const writeButton = document.getElementById('write-button');
            if (writeButton) {
                writeButton.style.display = 'none';
            }
        }

        // 총 게시글 수 업데이트
        async function updateTotalCount() {
            console.log('총 게시글 수 업데이트');

            const collection = boardConfig[boardType].collection;
            const options = categoryFilter ? { where: { field: 'category', operator: '==', value: categoryFilter } } : {};

            try {
                await waitForServices();

                const result = await dbService.countDocuments(collection, options);
                if (result.success) {
                    const totalCount = document.getElementById('total-count');
                    if (totalCount) {
                        totalCount.textContent = result.count;
                    }
                } else {
                    console.error('게시글 수 조회 실패:', result.error);
                }
            } catch (error) {
                console.error('게시글 수 조회 오류:', error);
            }
        }

        // 초기화
        console.log('목록 페이지 초기화 시작');
        setupSearch();
        hideWriteButton(); // 글쓰기 버튼 숨김 (기존 checkWritePermission 대체)

        // Firebase 연동 시도, 실패시 샘플 데이터 사용
        try {
            loadPosts(true);
            updateTotalCount();
        } catch (error) {
            console.log('Firebase 연동 실패, 샘플 데이터 사용');
            loadSampleData();
        }
    }

    // 상세보기 페이지 초기화
    function initViewPage() {
        console.log('상세보기 페이지 초기화');

        const boardType = getBoardType();
        if (!boardType) {
            console.log('게시판 타입 확인 실패');
            return;
        }

        // URL에서 게시글 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (!postId) {
            alert('잘못된 접근입니다.');
            window.location.href = 'index.html';
            return;
        }

        console.log(`게시글 ID: ${postId}`);

        // 샘플 게시글 데이터
        function loadSamplePost() {
            const samplePost = {
                id: postId,
                title: '테스트2',
                category: 'notice',
                content: '테스트2 그룹 샘업<br><br>테스트2 내용입니다.',
                authorName: 'gostepexercise@gmail.com',
                createdAt: { seconds: Date.now() / 1000 - 86400 },
                views: 30,
                attachments: [
                    {
                        name: '부록.hwp',
                        url: '#',
                        size: 1048576
                    }
                ]
            };

            displayPost(samplePost);
        }

        // 게시글 정보 로드
        async function loadPost() {
            console.log('게시글 로드 시작');

            const collection = boardConfig[boardType].collection;

            try {
                await waitForServices();

                const result = await dbService.getDocument(collection, postId);

                if (result.success) {
                    console.log('게시글 로드 성공');
                    displayPost(result.data);
                    updateViews(postId);
                    loadPrevNextPost(postId);
                    hideAdminButtons(); // 관리자 버튼 숨김 (기존 checkAdminButtons 대체)
                } else {
                    console.error('게시글 로드 실패:', result.error);
                    // Firebase 연동 실패 시 샘플 데이터 사용
                    loadSamplePost();
                }
            } catch (error) {
                console.error('게시글 로드 오류:', error);
                // 오류 발생 시 샘플 데이터 사용
                loadSamplePost();
            }
        }

        // 관리자 버튼 숨김 (기존 코드 비활성화)
        function hideAdminButtons() {
            console.log('관리자 버튼 숨김');

            const adminButtons = document.getElementById('admin-buttons');
            if (adminButtons) {
                adminButtons.style.display = 'none';
            }
        }

        // 게시글 표시
        function displayPost(post) {
            console.log('게시글 표시');

            // 제목
            const titleElement = document.getElementById(getElementId(boardType, 'title'));
            if (titleElement) titleElement.textContent = post.title;

            // 브레드크럼브
            const breadcrumbTitle = document.getElementById(getElementId(boardType, 'title-breadcrumb'));
            if (breadcrumbTitle) breadcrumbTitle.textContent = post.title;

            // 카테고리
            const categoryElement = document.getElementById(getElementId(boardType, 'category'));
            if (categoryElement) {
                const categoryText = getCategoryText(boardType, post.category);
                const badgeClass = `category-badge ${post.category}`;
                categoryElement.innerHTML = `<span class="${badgeClass}">${categoryText}</span>`;
            }

            // 작성일
            const dateElement = document.getElementById(getElementId(boardType, 'date'));
            if (dateElement && post.createdAt) {
                dateElement.textContent = new Date(post.createdAt.seconds * 1000).toLocaleDateString('ko-KR');
            }

            // 작성자
            const authorElement = document.getElementById(getElementId(boardType, 'author'));
            if (authorElement) {
                // videos 페이지의 경우 강사명 표시
                if (boardType === 'videos') {
                    authorElement.textContent = post.instructor || post.authorName || '관리자';
                } else {
                    authorElement.textContent = post.authorName || '관리자';
                }
            }

            // 조회수
            const viewsElement = document.getElementById(getElementId(boardType, 'views'));
            if (viewsElement) viewsElement.textContent = post.views || 0;

            // 내용
            const contentElement = document.getElementById(getElementId(boardType, 'content'));
            if (contentElement) {
                // HTML 내용 그대로 표시 (이미지, 링크 등 포함)
                contentElement.innerHTML = post.content;
            }

            // 첨부파일
            if (post.attachments && post.attachments.length > 0) {
                displayAttachments(post.attachments);
            }

            // 비디오 플레이어 처리 (videos 페이지에만 해당)
            if (boardType === 'videos' && post.videoUrl) {
                displayVideoPlayer(post.videoUrl, post.videoType || 'youtube');
            }
        }

        // 비디오 플레이어 표시
        function displayVideoPlayer(videoUrl, videoType) {
            console.log(`비디오 플레이어 표시: ${videoType}`);

            const videoContainer = document.getElementById('video-container');
            if (!videoContainer) return;

            let embedHtml = '';

            if (videoType === 'youtube') {
                // YouTube 동영상 ID 추출
                const youtubeIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : null;

                if (youtubeId) {
                    embedHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                }
            } else if (videoType === 'vimeo') {
                // Vimeo 동영상 ID 추출
                const vimeoIdMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                const vimeoId = vimeoIdMatch ? vimeoIdMatch[1] : null;

                if (vimeoId) {
                    embedHtml = `<iframe width="100%" height="100%" src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
                }
            } else if (videoType === 'direct') {
                // 직접 업로드 동영상
                embedHtml = `
                    <video width="100%" height="100%" controls>
                        <source src="${videoUrl}" type="video/mp4">
                        이 브라우저에서는 동영상을 재생할 수 없습니다.
                    </video>
                `;
            }

            if (embedHtml) {
                videoContainer.innerHTML = embedHtml;
            } else {
                videoContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center w-full h-full bg-gray-800 text-white p-8 text-center">
                        <svg class="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 class="text-lg font-medium mb-2">동영상을 불러올 수 없습니다</h3>
                        <p class="text-gray-300 text-sm">유효하지 않은 동영상 URL입니다.</p>
                    </div>
                `;
            }
        }

        // 조회수 증가
        async function updateViews(postId) {
            console.log('조회수 증가');

            const collection = boardConfig[boardType].collection;

            try {
                const result = await dbService.getDocument(collection, postId);
                if (result.success) {
                    const currentViews = result.data.views || 0;
                    await dbService.updateDocument(collection, postId, {
                        views: currentViews + 1
                    });
                    console.log(`조회수 업데이트 완료: ${currentViews + 1}`);
                }
            } catch (error) {
                console.error('조회수 업데이트 오류:', error);
            }
        }

        // 첨부파일 표시
        function displayAttachments(attachments) {
            console.log(`첨부파일 표시: ${attachments.length}개`);

            const attachmentsSection = document.getElementById(getElementId(boardType, 'attachments'));
            const attachmentList = document.getElementById('attachment-list');

            if (attachmentsSection && attachmentList) {
                attachmentsSection.classList.remove('hidden');
                attachmentList.innerHTML = '';

                attachments.forEach(attachment => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <a href="${attachment.url}" target="_blank" class="download-link">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="file-name">${attachment.name}</span>
                            <span class="file-info">${formatFileSize(attachment.size)}</span>
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

        // 이전글/다음글 로드
        async function loadPrevNextPost(currentPostId) {
            console.log('이전/다음 게시글 로드');

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
            const elementId = `${type}-${boardType}`;
            const container = document.getElementById(elementId);

            if (container) {
                container.classList.remove('hidden');
                const link = container.querySelector('a');
                if (link) {
                    link.href = `view.html?id=${post.id}`;
                    const titleElement = link.querySelector('.nav-title');
                    if (titleElement) {
                        titleElement.textContent = post.title;
                    }
                }
            }
        }

        // 초기화
        console.log('상세보기 페이지 초기화 시작');
        loadPost();
    }

    // 페이지 초기화
    async function init() {
        console.log('board.js 초기화 시작');

        try {
            const boardType = getBoardType();
            if (!boardType) {
                console.log('게시판 타입 확인 실패');
                return;
            }

            console.log(`게시판 타입: ${boardType}`);

            if (isListPage()) {
                console.log('목록 페이지 초기화');
                initListPage();
            } else {
                console.log('상세보기 페이지 초기화');
                initViewPage();
            }
        } catch (error) {
            console.error('board.js 초기화 오류:', error);
        }
    }

    // DOMContentLoaded 이벤트 리스너
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 전역 객체에 필요한 함수 노출
    window.boardService = {
        getBoardType,
        hasPermission,
        getCategoryText,
        init
    };

})();