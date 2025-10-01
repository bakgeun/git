/**
 * 스토리지 관련 서비스
 * Firebase Storage 관련 파일 업로드, 다운로드, 삭제 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
    // storageService 네임스페이스 생성
    window.storageService = {
        /**
         * 파일 업로드
         * 
         * @param {File} file - 업로드할 파일 객체
         * @param {string} path - 저장 경로 (폴더/파일명)
         * @param {object} metadata - 파일 메타데이터 (선택적)
         * @returns {Promise} - 업로드 결과 프로미스
         */
        uploadFile: async function (file, path, metadata = {}) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 🔧 수정: 파일 확장자 유효성 검사 (허용된 확장자 목록) - .hwpx 추가
                const allowedExtensions = [
                    // 이미지 파일
                    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
                    // 문서 파일
                    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                    // 텍스트 파일
                    'txt', 'csv', 'rtf',
                    // 한글 파일 (🔧 .hwpx 추가)
                    'hwp', 'hwpx',
                    // 압축 파일
                    'zip', 'rar', '7z'
                ];
                const fileExt = file.name.split('.').pop().toLowerCase();

                if (!allowedExtensions.includes(fileExt)) {
                    return {
                        success: false,
                        error: { message: `지원되지 않는 파일 형식입니다. 허용된 확장자: ${allowedExtensions.join(', ')}` }
                    };
                }

                // 파일 크기 제한 (10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB

                if (file.size > maxSize) {
                    return {
                        success: false,
                        error: { message: `파일 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.` }
                    };
                }

                // 🔧 수정: customMetadata를 올바르게 병합
                const defaultMetadata = {
                    contentType: file.type || 'application/octet-stream',
                    customMetadata: {
                        originalName: file.name,
                        uploadedAt: new Date().toISOString()
                    }
                };

                // 사용자 지정 메타데이터가 있으면 병합
                if (metadata.customMetadata) {
                    defaultMetadata.customMetadata = {
                        ...defaultMetadata.customMetadata,
                        ...metadata.customMetadata
                    };
                }

                // 나머지 메타데이터 속성 병합 (customMetadata 제외)
                const { customMetadata, ...otherMetadata } = metadata;
                const mergedMetadata = {
                    ...defaultMetadata,
                    ...otherMetadata
                };

                // 스토리지 경로 참조 생성
                const storageRef = window.dhcFirebase.storage.ref(path);

                // 파일 업로드 시작
                const uploadTask = storageRef.put(file, mergedMetadata);

                // 업로드 프로미스 반환
                return new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        // 진행률 업데이트
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`업로드 진행률: ${progress.toFixed(2)}%`);

                            // 진행률 이벤트 디스패치
                            const progressEvent = new CustomEvent('fileUploadProgress', {
                                detail: {
                                    path: path,
                                    progress: progress,
                                    snapshot: snapshot
                                }
                            });
                            document.dispatchEvent(progressEvent);
                        },
                        // 오류 처리
                        (error) => {
                            console.error('파일 업로드 오류:', error);
                            reject({ success: false, error: error });
                        },
                        // 완료 처리
                        async () => {
                            try {
                                // 다운로드 URL 가져오기
                                const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();

                                // 메타데이터 가져오기
                                const metadata = await uploadTask.snapshot.ref.getMetadata();

                                resolve({
                                    success: true,
                                    url: downloadUrl,
                                    path: path,
                                    metadata: metadata
                                });
                            } catch (error) {
                                console.error('다운로드 URL 가져오기 오류:', error);
                                reject({ success: false, error: error });
                            }
                        }
                    );
                });
            } catch (error) {
                console.error('파일 업로드 오류:', error);
                return { success: false, error: error };
            }
        },

        /**
         * 여러 파일 업로드
         * 
         * @param {Array<File>} files - 업로드할 파일 배열
         * @param {string} basePath - 기본 저장 경로
         * @param {object} metadata - 파일 메타데이터 (선택적)
         * @returns {Promise} - 업로드 결과 프로미스
         */
        uploadMultipleFiles: async function (files, basePath, metadata = {}) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 업로드 결과 배열
                const results = [];

                // 각 파일 순차적으로 업로드
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];

                    // 파일명에 타임스탬프 추가하여 중복 방지
                    const timestamp = new Date().getTime();
                    const fileName = file.name;
                    const fileExt = fileName.split('.').pop();
                    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
                    const newFileName = `${fileNameWithoutExt}_${timestamp}.${fileExt}`;

                    // 파일 경로 생성
                    const filePath = `${basePath}/${newFileName}`;

                    // 단일 파일 업로드 실행
                    const result = await this.uploadFile(file, filePath, metadata);

                    // 결과 저장
                    results.push({
                        originalFile: file,
                        result: result
                    });
                }

                // 전체 성공 여부 확인
                const allSuccess = results.every(item => item.result.success);

                return {
                    success: allSuccess,
                    results: results
                };
            } catch (error) {
                console.error('다중 파일 업로드 오류:', error);
                return { success: false, error: error };
            }
        },

        /**
         * 파일 다운로드 URL 가져오기
         * 
         * @param {string} path - 파일 경로
         * @returns {Promise} - 다운로드 URL 프로미스
         */
        getDownloadUrl: async function (path) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 스토리지 경로 참조 생성
                const storageRef = window.dhcFirebase.storage.ref(path);

                // 다운로드 URL 가져오기
                const url = await storageRef.getDownloadURL();

                return { success: true, url: url };
            } catch (error) {
                console.error(`${path} 다운로드 URL 가져오기 오류:`, error);
                return { success: false, error: error };
            }
        },

        /**
         * 파일 삭제
         * 
         * @param {string} path - 삭제할 파일 경로
         * @returns {Promise} - 삭제 결과 프로미스
         */
        deleteFile: async function (path) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 스토리지 경로 참조 생성
                const storageRef = window.dhcFirebase.storage.ref(path);

                // 파일 삭제
                await storageRef.delete();

                return { success: true };
            } catch (error) {
                console.error(`${path} 파일 삭제 오류:`, error);
                return { success: false, error: error };
            }
        },

        /**
         * 여러 파일 삭제
         * 
         * @param {Array<string>} paths - 삭제할 파일 경로 배열
         * @returns {Promise} - 삭제 결과 프로미스
         */
        deleteMultipleFiles: async function (paths) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 삭제 결과 배열
                const results = [];

                // 각 파일 순차적으로 삭제
                for (const path of paths) {
                    try {
                        const result = await this.deleteFile(path);
                        results.push({
                            path: path,
                            success: true
                        });
                    } catch (error) {
                        console.error(`${path} 파일 삭제 오류:`, error);
                        results.push({
                            path: path,
                            success: false,
                            error: error
                        });
                    }
                }

                // 전체 성공 여부 확인
                const allSuccess = results.every(item => item.success);

                return {
                    success: allSuccess,
                    results: results
                };
            } catch (error) {
                console.error('다중 파일 삭제 오류:', error);
                return { success: false, error: error };
            }
        },

        /**
         * 파일 메타데이터 가져오기
         * 
         * @param {string} path - 파일 경로
         * @returns {Promise} - 메타데이터 프로미스
         */
        getFileMetadata: async function (path) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 스토리지 경로 참조 생성
                const storageRef = window.dhcFirebase.storage.ref(path);

                // 메타데이터 가져오기
                const metadata = await storageRef.getMetadata();

                return { success: true, metadata: metadata };
            } catch (error) {
                console.error(`${path} 메타데이터 가져오기 오류:`, error);
                return { success: false, error: error };
            }
        },

        /**
         * 파일 메타데이터 업데이트
         * 
         * @param {string} path - 파일 경로
         * @param {object} metadata - 업데이트할 메타데이터
         * @returns {Promise} - 업데이트 결과 프로미스
         */
        updateFileMetadata: async function (path, metadata) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 스토리지 경로 참조 생성
                const storageRef = window.dhcFirebase.storage.ref(path);

                // 메타데이터 업데이트
                const updatedMetadata = await storageRef.updateMetadata(metadata);

                return { success: true, metadata: updatedMetadata };
            } catch (error) {
                console.error(`${path} 메타데이터 업데이트 오류:`, error);
                return { success: false, error: error };
            }
        },

        /**
         * 폴더 내 파일 목록 가져오기
         * 
         * @param {string} folderPath - 폴더 경로
         * @returns {Promise} - 파일 목록 프로미스
         */
        listFiles: async function (folderPath) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.storage) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }

                // 폴더 경로 슬래시로 끝나도록 조정
                const path = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

                // 스토리지 경로 참조 생성
                const storageRef = window.dhcFirebase.storage.ref(path);

                // 파일 목록 가져오기
                const result = await storageRef.listAll();

                // 결과 처리
                const items = [];

                // 파일들 (items)
                for (const item of result.items) {
                    const metadata = await item.getMetadata();
                    const downloadUrl = await item.getDownloadURL();

                    items.push({
                        name: item.name,
                        fullPath: item.fullPath,
                        url: downloadUrl,
                        metadata: metadata
                    });
                }

                // 서브폴더들 (prefixes)
                const prefixes = result.prefixes.map(prefix => ({
                    name: prefix.name,
                    fullPath: prefix.fullPath
                }));

                return {
                    success: true,
                    files: items,
                    folders: prefixes
                };
            } catch (error) {
                console.error(`${folderPath} 폴더 파일 목록 가져오기 오류:`, error);
                return { success: false, error: error };
            }
        }
    };
})();