/**
 * API 서비스
 * 외부 API와의 통신을 담당하는 서비스
 */

(function() {
    'use strict';

    window.apiService = {
        /**
         * 기본 설정
         * @private
         */
        _config: {
            baseURL: '',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: false,
            errorHandler: null,
            requestInterceptor: null,
            responseInterceptor: null
        },

        /**
         * 진행 중인 요청 저장소
         * @private
         */
        _pendingRequests: new Map(),

        /**
         * API 서비스 초기화
         * @param {Object} config - 설정 객체
         */
        init: function(config = {}) {
            this._config = Object.assign({}, this._config, config);
        },

        /**
         * 기본 헤더 설정
         * @param {string} key - 헤더 키
         * @param {string} value - 헤더 값
         */
        setHeader: function(key, value) {
            this._config.headers[key] = value;
        },

        /**
         * 인증 토큰 설정
         * @param {string} token - 인증 토큰
         */
        setAuthToken: function(token) {
            if (token) {
                this.setHeader('Authorization', `Bearer ${token}`);
            } else {
                delete this._config.headers['Authorization'];
            }
        },

        /**
         * GET 요청
         * @param {string} url - 요청 URL
         * @param {Object} params - 쿼리 파라미터
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        get: async function(url, params = {}, options = {}) {
            const queryString = this._buildQueryString(params);
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return this._request('GET', fullUrl, null, options);
        },

        /**
         * POST 요청
         * @param {string} url - 요청 URL
         * @param {Object} data - 요청 데이터
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        post: async function(url, data = {}, options = {}) {
            return this._request('POST', url, data, options);
        },

        /**
         * PUT 요청
         * @param {string} url - 요청 URL
         * @param {Object} data - 요청 데이터
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        put: async function(url, data = {}, options = {}) {
            return this._request('PUT', url, data, options);
        },

        /**
         * PATCH 요청
         * @param {string} url - 요청 URL
         * @param {Object} data - 요청 데이터
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        patch: async function(url, data = {}, options = {}) {
            return this._request('PATCH', url, data, options);
        },

        /**
         * DELETE 요청
         * @param {string} url - 요청 URL
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        delete: async function(url, options = {}) {
            return this._request('DELETE', url, null, options);
        },

        /**
         * 파일 업로드
         * @param {string} url - 업로드 URL
         * @param {File|FormData} file - 파일 또는 FormData
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        upload: async function(url, file, options = {}) {
            const formData = file instanceof FormData ? file : new FormData();
            
            if (file instanceof File) {
                formData.append('file', file);
            }

            // 파일 업로드시 Content-Type 헤더 제거 (브라우저가 자동 설정)
            const headers = Object.assign({}, this._config.headers);
            delete headers['Content-Type'];

            return this._request('POST', url, formData, {
                ...options,
                headers: { ...headers, ...options.headers },
                onUploadProgress: options.onUploadProgress
            });
        },

        /**
         * 파일 다운로드
         * @param {string} url - 다운로드 URL
         * @param {string} filename - 저장할 파일명
         * @param {Object} options - 추가 옵션
         * @returns {Promise} - 응답 프로미스
         */
        download: async function(url, filename, options = {}) {
            const response = await this._request('GET', url, null, {
                ...options,
                responseType: 'blob'
            });

            // 파일 다운로드 트리거
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename || this._extractFilename(response.headers);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return response;
        },

        /**
         * 요청 취소
         * @param {string} requestId - 요청 ID
         */
        cancel: function(requestId) {
            const controller = this._pendingRequests.get(requestId);
            if (controller) {
                controller.abort();
                this._pendingRequests.delete(requestId);
            }
        },

        /**
         * 모든 요청 취소
         */
        cancelAll: function() {
            this._pendingRequests.forEach(controller => controller.abort());
            this._pendingRequests.clear();
        },

        /**
         * HTTP 요청 수행
         * @private
         */
        _request: async function(method, url, data, options = {}) {
            // 요청 ID 생성
            const requestId = options.requestId || `${method}_${url}_${Date.now()}`;
            
            // AbortController 생성
            const controller = new AbortController();
            this._pendingRequests.set(requestId, controller);

            // 설정 병합
            const config = {
                method: method,
                headers: { ...this._config.headers, ...options.headers },
                body: this._prepareRequestBody(data, options),
                signal: controller.signal,
                credentials: this._config.withCredentials ? 'include' : 'same-origin',
                ...options
            };

            // URL 처리
            const fullUrl = this._buildFullUrl(url);

            // 타임아웃 설정
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, options.timeout || this._config.timeout);

            try {
                // 요청 인터셉터 실행
                if (this._config.requestInterceptor) {
                    const interceptedConfig = await this._config.requestInterceptor(config);
                    Object.assign(config, interceptedConfig);
                }

                // 요청 수행
                const response = await fetch(fullUrl, config);
                clearTimeout(timeoutId);

                // 응답 처리
                let responseData = await this._processResponse(response, options);

                // 응답 인터셉터 실행
                if (this._config.responseInterceptor) {
                    responseData = await this._config.responseInterceptor(responseData);
                }

                // 요청 완료 처리
                this._pendingRequests.delete(requestId);

                // 에러 응답 처리
                if (!response.ok) {
                    throw this._createError(response, responseData);
                }

                return responseData;

            } catch (error) {
                this._pendingRequests.delete(requestId);
                clearTimeout(timeoutId);

                // 에러 핸들러 실행
                if (this._config.errorHandler) {
                    this._config.errorHandler(error);
                }

                throw error;
            }
        },

        /**
         * 전체 URL 생성
         * @private
         */
        _buildFullUrl: function(url) {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return this._config.baseURL + url;
        },

        /**
         * 쿼리 스트링 생성
         * @private
         */
        _buildQueryString: function(params) {
            if (!params || Object.keys(params).length === 0) return '';
            
            return Object.keys(params)
                .filter(key => params[key] !== undefined && params[key] !== null)
                .map(key => {
                    const value = params[key];
                    if (Array.isArray(value)) {
                        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
                    }
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                })
                .join('&');
        },

        /**
         * 요청 본문 준비
         * @private
         */
        _prepareRequestBody: function(data, options) {
            if (!data) return null;
            
            if (data instanceof FormData || data instanceof Blob || data instanceof ArrayBuffer) {
                return data;
            }
            
            if (typeof data === 'object') {
                return JSON.stringify(data);
            }
            
            return data;
        },

        /**
         * 응답 처리
         * @private
         */
        _processResponse: async function(response, options) {
            const contentType = response.headers.get('content-type');
            
            let data;
            if (options.responseType === 'blob') {
                data = await response.blob();
            } else if (options.responseType === 'arraybuffer') {
                data = await response.arrayBuffer();
            } else if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                data: data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: options,
                request: response
            };
        },

        /**
         * 에러 객체 생성
         * @private
         */
        _createError: function(response, responseData) {
            const error = new Error(responseData.data?.message || response.statusText);
            error.response = responseData;
            error.status = response.status;
            error.statusText = response.statusText;
            return error;
        },

        /**
         * 파일명 추출
         * @private
         */
        _extractFilename: function(headers) {
            const contentDisposition = headers.get('content-disposition');
            if (!contentDisposition) return 'download';
            
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                return filenameMatch[1].replace(/['"]/g, '');
            }
            return 'download';
        },

        /**
         * 재시도 로직이 포함된 요청
         * @param {function} requestFn - 요청 함수
         * @param {Object} options - 재시도 옵션
         * @returns {Promise} - 응답 프로미스
         */
        retry: async function(requestFn, options = {}) {
            const {
                retries = 3,
                retryDelay = 1000,
                retryCondition = (error) => error.status >= 500
            } = options;

            let lastError;
            
            for (let i = 0; i < retries; i++) {
                try {
                    return await requestFn();
                } catch (error) {
                    lastError = error;
                    
                    if (i < retries - 1 && retryCondition(error)) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
                    } else {
                        throw error;
                    }
                }
            }
            
            throw lastError;
        },

        /**
         * 결제 관련 API
         */
        payment: {
            /**
             * 결제 요청
             * @param {Object} paymentData - 결제 데이터
             * @returns {Promise} - 결제 결과
             */
            request: async function(paymentData) {
                return apiService.post('/api/payments/request', paymentData);
            },

            /**
             * 결제 확인
             * @param {string} paymentId - 결제 ID
             * @returns {Promise} - 확인 결과
             */
            confirm: async function(paymentId) {
                return apiService.post(`/api/payments/${paymentId}/confirm`);
            },

            /**
             * 결제 취소
             * @param {string} paymentId - 결제 ID
             * @param {Object} cancelData - 취소 데이터
             * @returns {Promise} - 취소 결과
             */
            cancel: async function(paymentId, cancelData) {
                return apiService.post(`/api/payments/${paymentId}/cancel`, cancelData);
            },

            /**
             * 결제 내역 조회
             * @param {Object} params - 조회 파라미터
             * @returns {Promise} - 결제 내역
             */
            getHistory: async function(params = {}) {
                return apiService.get('/api/payments/history', params);
            }
        },

        /**
         * 파일 관련 API
         */
        file: {
            /**
             * 파일 업로드
             * @param {File} file - 업로드할 파일
             * @param {Object} options - 업로드 옵션
             * @returns {Promise} - 업로드 결과
             */
            upload: async function(file, options = {}) {
                const formData = new FormData();
                formData.append('file', file);
                
                if (options.metadata) {
                    Object.keys(options.metadata).forEach(key => {
                        formData.append(key, options.metadata[key]);
                    });
                }

                return apiService.upload('/api/files/upload', formData, {
                    onUploadProgress: options.onProgress
                });
            },

            /**
             * 파일 다운로드
             * @param {string} fileId - 파일 ID
             * @param {string} filename - 저장할 파일명
             * @returns {Promise} - 다운로드 결과
             */
            download: async function(fileId, filename) {
                return apiService.download(`/api/files/${fileId}/download`, filename);
            },

            /**
             * 파일 삭제
             * @param {string} fileId - 파일 ID
             * @returns {Promise} - 삭제 결과
             */
            delete: async function(fileId) {
                return apiService.delete(`/api/files/${fileId}`);
            }
        },

        /**
         * 통계 API
         */
        stats: {
            /**
             * 대시보드 통계 조회
             * @returns {Promise} - 통계 데이터
             */
            getDashboard: async function() {
                return apiService.get('/api/stats/dashboard');
            },

            /**
             * 사용자 통계 조회
             * @param {Object} params - 조회 파라미터
             * @returns {Promise} - 사용자 통계
             */
            getUsers: async function(params = {}) {
                return apiService.get('/api/stats/users', params);
            },

            /**
             * 결제 통계 조회
             * @param {Object} params - 조회 파라미터
             * @returns {Promise} - 결제 통계
             */
            getPayments: async function(params = {}) {
                return apiService.get('/api/stats/payments', params);
            },

            /**
             * 교육 통계 조회
             * @param {Object} params - 조회 파라미터
             * @returns {Promise} - 교육 통계
             */
            getCourses: async function(params = {}) {
                return apiService.get('/api/stats/courses', params);
            }
        }
    };

    // Firebase Functions API 호출을 위한 확장
    window.apiService.firebase = {
        /**
         * Firebase Function 호출
         * @param {string} functionName - 함수 이름
         * @param {Object} data - 전달할 데이터
         * @returns {Promise} - 함수 실행 결과
         */
        callFunction: async function(functionName, data = {}) {
            // Firebase Functions가 초기화되어 있는지 확인
            if (!window.firebase || !window.firebase.functions) {
                throw new Error('Firebase Functions가 초기화되지 않았습니다.');
            }

            const functions = window.firebase.functions();
            const callableFunction = functions.httpsCallable(functionName);

            try {
                const result = await callableFunction(data);
                return result.data;
            } catch (error) {
                console.error(`Firebase Function ${functionName} 호출 오류:`, error);
                throw error;
            }
        }
    };
})();