/**
 * 스크립트 로더 (수정된 버전)
 * 페이지의 깊이에 따라 스크립트 경로를 자동으로 조정합니다.
 */

console.log('script-loader.js 파일이 로드되었습니다.');

(function () {
    // 현재 경로에 따른 기본 경로 계산
    function getBasePath() {
        const currentPath = window.location.pathname;
        console.log('현재 경로:', currentPath);

        // 루트 경로인 경우
        if (currentPath === '/' || currentPath === '/index.html') {
            console.log('루트 경로 감지, basePath = ""');
            return '';
        }

        // 상대 경로 계산
        const directoryPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const pathSegments = directoryPath.split('/').filter(p => p);
        const depth = pathSegments.length;

        console.log('경로 세그먼트:', pathSegments, '깊이:', depth);

        let basePath = '';
        for (let i = 0; i < depth; i++) {
            basePath += '../';
        }

        console.log('수정된 basePath:', basePath);
        return basePath;
    }

    // 스크립트를 동적으로 로드 (실행 가능하도록)
    function loadScriptSrc(src) {
        return new Promise((resolve, reject) => {
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

    // 페이지에 필요한 스크립트 로드
    // 기존 코드를 수정하여 텍스트 기반으로 스크립트 URL 추출
    async function loadScripts() {
        const basePath = getBasePath();

        try {
            // Firebase SDK 템플릿에서 스크립트 URL 추출
            const scriptTemplate = document.getElementById('firebase-sdk-template');
            if (scriptTemplate) {
                console.log('Firebase SDK 템플릿 찾음');
                console.log('템플릿 내용:', scriptTemplate.innerHTML);

                // 정규식을 사용하여 스크립트 src 추출
                const content = scriptTemplate.innerHTML.replace(/{basePath}/g, basePath);
                console.log('처리된 내용:', content);

                // src 속성 값들을 추출하는 정규식 (= 추가됨)
                const srcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
                const scripts = [];
                let match;

                while ((match = srcRegex.exec(content)) !== null) {
                    scripts.push(match[1]);
                }

                console.log('추출된 스크립트 URL들:', scripts);
                console.log('로드할 스크립트 개수:', scripts.length);

                // 스크립트를 순차적으로 로드
                for (const src of scripts) {
                    await loadScriptSrc(src);
                }

                // 템플릿 제거
                scriptTemplate.remove();
                console.log('Firebase SDK 스크립트 로드 완료');
            } else {
                console.error('Firebase SDK 템플릿을 찾을 수 없음');
            }

            // 추가 스크립트도 동일한 방식으로 처리
            const additionalScripts = document.getElementById('additional-scripts-template');
            if (additionalScripts) {
                console.log('추가 스크립트 템플릿 찾음');

                const content = additionalScripts.innerHTML.replace(/{basePath}/g, basePath);

                // 정규식으로 스크립트 src 추출 (= 추가됨)
                const srcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
                const scripts = [];
                let match;

                while ((match = srcRegex.exec(content)) !== null) {
                    scripts.push(match[1]);
                }

                console.log('로드할 추가 스크립트 개수:', scripts.length);

                // 추가 스크립트를 순차적으로 로드
                for (const src of scripts) {
                    await loadScriptSrc(src);
                }

                additionalScripts.remove();
                console.log('추가 스크립트 로드 완료');
            } else {
                console.error('추가 스크립트 템플릿을 찾을 수 없음');
            }

        } catch (error) {
            console.error('스크립트 로드 중 오류:', error);
        }
    }

    // 경로 조정 함수 (전역으로 노출)
    window.adjustPath = function (path) {
        if (!path || path === '#') return path;

        const basePath = getBasePath();

        // 이미 절대 경로인 경우
        if (path.startsWith('/')) {
            return path.substring(1); // 맨 앞의 '/' 제거
        }

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

    console.log('script-loader.js 실행됨, DOMContentLoaded 이벤트 대기 중');

    // 페이지 로드 시 스크립트 로드
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOMContentLoaded 이벤트 발생, 스크립트 로드 시작');
        loadScripts();
    });
})();