/**
 * board.js
 * 게시판 관련 공통 기능 개선
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
                    <td colspan="6" class="px-6 py-4 text-center">
                        <div class="loading-spinner"></div>
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
            return;
        }

        console.log(`게시판 타입: ${boardType}`);

        let currentPage = 1;
        let lastDoc = null;
        let hasMore = true;
        let searchQuery = '';
        let categoryFilter = '';

        // 게시글 목록 가져오기
        async function loadPosts(reset = false) {
            console.log(`게시글 로드: reset=${reset}`);

            // 게시판 타입에 따른 올바른 tbody ID 가져오기
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
                    // 검색 쿼리가 있는 경우
                    console.log(`검색 실행: ${searchQuery}`);
                    result = await dbService.searchDocuments(collection, 'title', searchQuery, options);
                } else {
                    // 일반 페이지네이션
                    result = await dbService.getPaginatedDocuments(collection, options, lastDoc);
                }

                if (result.success) {
                    displayPosts(result.data, reset);
                    lastDoc = result.lastDoc;
                    hasMore = result.hasMore;
                    updatePagination();
                } else {
                    console.error('게시글 로드 실패:', result.error);
                    showError(tbody, '게시글을 불러오는 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('게시글 로드 중 오류:', error);
                showError(tbody, '게시글을 불러오는 중 오류가 발생했습니다.');
            }
        }

        // 오류 표시
        function showError(tbody, message) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-4 text-center text-red-500">
                            ${message}
                        </td>
                    </tr>
                `;
            }
        }

        // 게시글 표시
        function displayPosts(posts, reset = false) {
            console.log(`게시글 표시: ${posts.length}개, reset=${reset}`);

            const listId = getElementId(boardType, 'list');
            const tbody = document.getElementById(listId);
            if (!tbody) return;

            if (reset) {
                tbody.innerHTML = '';
            }

            if (posts.length === 0 && reset) {
                tbody.innerHTML = `
                    <tr class="no-results">
                        <td colspan="6" class="px-6 py-12 text-center">
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
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${number}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="category-badge ${post.category}">
                            ${categoryText}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <a href="view.html?id=${post.id}" class="post-title-link">
                            ${post.title}
                            ${post.attachments && post.attachments.length > 0 ? '<svg class="attachment-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>' : ''}
                            ${boardType === 'videos' ? '<svg class="attachment-icon text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' : ''}
                        </a>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">${boardType === 'videos' ? (post.instructor || post.authorName || '관리자') : (post.authorName || '관리자')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">${post.views || 0}</td>
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
                prevButton.className = 'relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50';
                prevButton.innerHTML = '이전';
                prevButton.onclick = () => {
                    currentPage--;
                    loadPosts();
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
                    loadPosts();
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

        // 글쓰기 버튼 권한 확인
        async function checkWritePermission() {
            console.log('글쓰기 권한 확인');

            try {
                await waitForServices();

                const writeButton = document.getElementById('write-button');
                if (writeButton) {
                    // 현재 사용자 정보 확인
                    const user = window.authService.getCurrentUser();

                    // 관리자인 경우 항상 표시
                    if (user && user.email === 'gostepexercise@gmail.com') {
                        console.log('관리자 확인됨, 글쓰기 권한 부여');
                        writeButton.classList.remove('hidden');
                        writeButton.addEventListener('click', () => {
                            console.log('글쓰기 버튼 클릭');
                            window.location.href = 'write.html';
                        });
                        return;
                    }

                    // 일반 권한 확인
                    if (hasPermission('write', boardType)) {
                        console.log('글쓰기 권한 있음');
                        writeButton.classList.remove('hidden');
                        writeButton.addEventListener('click', () => {
                            console.log('글쓰기 버튼 클릭');
                            window.location.href = 'write.html';
                        });
                    } else {
                        console.log('글쓰기 권한 없음');
                    }
                }
            } catch (error) {
                console.error('글쓰기 권한 확인 오류:', error);
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
        checkWritePermission();
        loadPosts(true);
        updateTotalCount();
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
                    checkAdminButtons(result.data);
                } else {
                    console.error('게시글 로드 실패:', result.error);
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
                // XSS 방지를 위한 기본적인 처리 및 줄바꿈 처리
                contentElement.innerHTML = post.content
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
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

        // 관리자 버튼 권한 확인
        async function checkAdminButtons(post) {
            console.log('관리자 버튼 권한 확인');

            try {
                await waitForServices();

                const adminButtons = document.getElementById('admin-buttons');
                const user = authService.getCurrentUser();

                if (adminButtons && user) {
                    let showButtons = false;

                    // 수정 버튼
                    if (hasPermission('edit', boardType, user.id, post.authorId)) {
                        const editButton = document.getElementById('edit-button');
                        if (editButton) {
                            editButton.classList.remove('hidden');
                            editButton.addEventListener('click', () => {
                                window.location.href = `write.html?id=${postId}`;
                            });
                            showButtons = true;
                        }
                    }

                    // 삭제 버튼
                    if (hasPermission('delete', boardType, user.id, post.authorId)) {
                        const deleteButton = document.getElementById('delete-button');
                        if (deleteButton) {
                            deleteButton.classList.remove('hidden');
                            deleteButton.addEventListener('click', () => {
                                if (confirm('정말 삭제하시겠습니까?')) {
                                    deletePost(postId);
                                }
                            });
                            showButtons = true;
                        }
                    }

                    if (showButtons) {
                        adminButtons.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('관리자 버튼 권한 확인 오류:', error);
            }
        }

        // 게시글 삭제
        async function deletePost(postId) {
            console.log('게시글 삭제 시도');

            const collection = boardConfig[boardType].collection;

            try {
                const result = await dbService.deleteDocument(collection, postId);

                if (result.success) {
                    alert('게시글이 삭제되었습니다.');
                    window.location.href = 'index.html';
                } else {
                    console.error('게시글 삭제 실패:', result.error);
                    alert('게시글 삭제 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('게시글 삭제 오류:', error);
                alert('게시글 삭제 중 오류가 발생했습니다.');
            }
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
                    const titleElement = link.querySelector('.flex-1');
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
            // 서비스 대기
            await waitForServices();

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

    console.log('=== board.js 파일 로드 완료 ===');
})();