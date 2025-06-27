/**
 * 스크립트 로더 (경로 계산 수정 버전)
 * 페이지의 깊이에 따라 스크립트 경로를 자동으로 조정합니다.
 * - 중복 실행 방지
 * - document.write 제거
 * - 성능 최적화
 * - 경로 계산 로직 개선
 */

console.log('script-loader.js 파일이 로드되었습니다.');

// 🔧 중복 실행 방지 및 전역 초기화
(function () {
    // 이미 초기화되었다면 중복 실행 방지
    if (window.scriptLoaderInitialized) {
        console.log('script-loader 이미 초기화됨, 중복 실행 방지');
        return;
    }
    
    // 초기화 플래그 설정
    window.scriptLoaderInitialized = true;
    
    // 경로 캐시 시스템
    const pathCache = new Map();
    
    /**
     * 현재 경로에 따른 기본 경로 계산 (수정된 버전)
     */
    function getBasePath() {
        const currentPath = window.location.pathname;
        
        // 캐시에서 확인
        if (pathCache.has(currentPath)) {
            return pathCache.get(currentPath);
        }
        
        console.log('현재 경로:', currentPath);

        // 실제 루트 경로인 경우만 체크 (더 엄격한 조건)
        if (currentPath === '/' || currentPath === '/index.html') {
            console.log('루트 경로 감지, basePath = ""');
            pathCache.set(currentPath, '');
            return '';
        }

        // 상대 경로 계산 (파일명 제거 후 디렉토리 깊이 계산)
        const directoryPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const pathSegments = directoryPath.split('/').filter(p => p && p !== '');
        const depth = pathSegments.length;

        // 디버깅 로그 추가
        console.log('디렉토리 경로:', directoryPath);
        console.log('경로 세그먼트:', pathSegments);
        console.log('계산된 깊이:', depth);

        let basePath = '';
        for (let i = 0; i < depth; i++) {
            basePath += '../';
        }

        console.log('계산된 basePath:', basePath);
        
        // 캐시에 저장
        pathCache.set(currentPath, basePath);
        return basePath;
    }

    /**
     * 스크립트를 동적으로 로드 (중복 방지)
     */
    function loadScriptSrc(src) {
        return new Promise((resolve, reject) => {
            // 이미 로드된 스크립트 확인
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                console.log('스크립트 이미 로드됨:', src);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            
            script.onload = () => {
                console.log('스크립트 로드 완료:', src);
                resolve();
            };
            
            script.onerror = () => {
                console.error('스크립트 로드 실패:', src);
                reject(new Error(`스크립트 로드 실패: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 스크립트 URL 추출 (정규식 개선)
     */
    function extractScriptUrls(content, basePath) {
        // {basePath} 플레이스홀더 교체
        const processedContent = content.replace(/{basePath}/g, basePath);
        
        // 스크립트 src 추출 정규식 (더 정확한 패턴)
        const srcRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
        const scripts = [];
        let match;

        while ((match = srcRegex.exec(processedContent)) !== null) {
            scripts.push(match[1]);
        }

        return scripts;
    }

    /**
     * 순차적 스크립트 로딩
     */
    async function loadScriptsSequentially(scripts) {
        console.log('로드할 스크립트 URL들:', scripts);
        console.log('총 스크립트 개수:', scripts.length);

        for (const src of scripts) {
            try {
                await loadScriptSrc(src);
            } catch (error) {
                console.error(`스크립트 로드 실패: ${src}`, error);
                // 중요하지 않은 스크립트 실패는 계속 진행
            }
        }
    }

    /**
     * 🔧 사용자 정보 초기화 (document.write 제거)
     */
    function initUserInfo() {
        // 세션 스토리지에서 사용자 정보 확인
        const savedAdminName = sessionStorage.getItem('admin_name') || '관리자';
        const savedAdminEmail = sessionStorage.getItem('admin_email') || 'gostepexercise@gmail.com';

        // DOM이 준비되면 사용자 정보 설정
        function setUserInfo() {
            const adminNameElem = document.getElementById('admin-name');
            const adminEmailElem = document.getElementById('admin-email');
            
            if (adminNameElem) {
                adminNameElem.textContent = savedAdminName;
                console.log('관리자 이름 설정:', savedAdminName);
            }
            
            if (adminEmailElem) {
                adminEmailElem.textContent = savedAdminEmail;
                console.log('관리자 이메일 설정:', savedAdminEmail);
            }
        }

        // DOM 상태에 따라 즉시 실행 또는 이벤트 대기
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setUserInfo);
        } else {
            setUserInfo();
        }
    }

    /**
     * 메인 스크립트 로딩 함수
     */
    async function loadScripts() {
        const basePath = getBasePath();

        try {
            // 🔧 Firebase SDK 스크립트 로드
            const scriptTemplate = document.getElementById('firebase-sdk-template');
            if (scriptTemplate) {
                console.log('Firebase SDK 템플릿 찾음');
                
                const content = scriptTemplate.textContent || scriptTemplate.innerHTML;
                const scripts = extractScriptUrls(content, basePath);
                
                console.log('Firebase SDK 스크립트 추출:', scripts);

                // 순차적으로 로드
                await loadScriptsSequentially(scripts);
                
                // 템플릿 제거 (중복 방지)
                scriptTemplate.remove();
                console.log('Firebase SDK 스크립트 로드 완료');
            } else {
                console.warn('Firebase SDK 템플릿을 찾을 수 없음');
            }

            // 🔧 추가 스크립트 로드
            const additionalScripts = document.getElementById('additional-scripts-template');
            if (additionalScripts) {
                console.log('추가 스크립트 템플릿 찾음');

                const content = additionalScripts.textContent || additionalScripts.innerHTML;
                const scripts = extractScriptUrls(content, basePath);
                
                console.log('추가 스크립트 추출:', scripts);

                // 순차적으로 로드
                await loadScriptsSequentially(scripts);
                
                // 템플릿 제거 (중복 방지)
                additionalScripts.remove();
                console.log('추가 스크립트 로드 완료');
            } else {
                console.warn('추가 스크립트 템플릿을 찾을 수 없음');
            }

        } catch (error) {
            console.error('스크립트 로드 중 오류:', error);
        }
    }

    /**
     * 🔧 경로 조정 함수 (전역으로 노출, 개선된 버전)
     */
    window.adjustPath = function (path) {
        if (!path || path === '#') return path;

        // 이미 절대 경로이거나 외부 URL인 경우
        if (path.startsWith('http') || path.startsWith('/') || path.startsWith('#')) {
            return path;
        }

        const basePath = getBasePath();

        // 이미 페이지 경로가 포함된 경우 (중복 방지)
        if (path.startsWith('pages/')) {
            const currentPathSegments = window.location.pathname.split('/').filter(p => p);
            
            // 현재 경로에 이미 'pages'가 포함되어 있는지 확인
            if (currentPathSegments.includes('pages')) {
                // 현재 경로에서 파일 이름과 'pages' 이후의 모든 세그먼트를 제거
                const rootToPages = currentPathSegments.slice(0, currentPathSegments.indexOf('pages'));
                // 필요한 상위 디렉토리 이동 계산
                let newBasePath = '';
                for (let i = 0; i < currentPathSegments.length - rootToPages.length; i++) {
                    newBasePath += '../';
                }
                return newBasePath + path;
            }
        }

        return basePath + path;
    };

    /**
     * 초기화 함수 (한 번만 실행)
     */
    function initialize() {
        if (window.scriptLoaderExecuted) {
            console.log('script-loader 이미 실행됨, 중복 실행 방지');
            return;
        }
        
        window.scriptLoaderExecuted = true;
        console.log('DOMContentLoaded 이벤트 발생, 스크립트 로드 시작');
        
        // 사용자 정보 초기화
        initUserInfo();
        
        // 스크립트 로드
        loadScripts();
    }

    // DOM 상태에 따른 초기화
    if (document.readyState === 'loading') {
        console.log('script-loader.js 실행됨, DOMContentLoaded 이벤트 대기 중');
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        console.log('DOM 이미 준비됨, 즉시 초기화');
        // DOM이 이미 준비되었으면 약간의 지연 후 실행 (다른 스크립트들과의 충돌 방지)
        setTimeout(initialize, 10);
    }

    // 🔧 디버깅을 위한 전역 함수
    window.scriptLoaderDebug = {
        getBasePath: getBasePath,
        pathCache: pathCache,
        reloadScripts: loadScripts,
        isInitialized: () => window.scriptLoaderInitialized,
        isExecuted: () => window.scriptLoaderExecuted
    };

})();

console.log('✅ script-loader.js 초기화 완료');