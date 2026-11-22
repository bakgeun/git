/**
 * cache-manager.js
 * 관리자 페이지 전용 데이터 캐싱 유틸리티
 */

(function() {
    'use strict';

    /**
     * 캐시 매니저 클래스
     */
    class CacheManager {
        constructor(options = {}) {
            this.cacheName = options.cacheName || 'default';
            this.cacheExpiry = options.cacheExpiry || 5 * 60 * 1000; // 기본 5분
            this.cache = null;
            this.cacheTimestamp = null;
            this.isLoading = false;
            this.loadingPromise = null;
        }

        /**
         * 캐시가 유효한지 확인
         */
        isValid() {
            if (!this.cache || !this.cacheTimestamp) {
                return false;
            }

            const now = Date.now();
            const cacheAge = now - this.cacheTimestamp;
            const isValid = cacheAge < this.cacheExpiry;

            if (isValid) {
                console.log(`✅ [${this.cacheName}] 캐시 유효 (${Math.floor(cacheAge / 1000)}초)`);
            } else {
                console.log(`⏰ [${this.cacheName}] 캐시 만료 (${Math.floor(cacheAge / 1000)}초)`);
            }

            return isValid;
        }

        /**
         * 캐시 무효화
         */
        invalidate() {
            this.cache = null;
            this.cacheTimestamp = null;
            this.isLoading = false;
            this.loadingPromise = null;
            console.log(`🗑️ [${this.cacheName}] 캐시 무효화됨`);
        }

        /**
         * 데이터 가져오기 (캐시 사용)
         * @param {Function} fetchFunction - 데이터를 가져오는 함수
         * @param {Boolean} forceRefresh - 강제 새로고침 여부
         */
        async getData(fetchFunction, forceRefresh = false) {
            // 캐시가 유효하고 강제 새로고침이 아니면 캐시 사용
            if (!forceRefresh && this.isValid()) {
                console.log(`✅ [${this.cacheName}] 캐시된 데이터 사용`);
                return this.cache;
            }

            // 중복 로딩 방지
            if (this.isLoading && this.loadingPromise) {
                console.log(`⏳ [${this.cacheName}] 이미 로딩 중... 대기`);
                return this.loadingPromise;
            }

            // 데이터 로드
            this.isLoading = true;
            console.log(`🔄 [${this.cacheName}] 데이터 조회 중...`);

            this.loadingPromise = (async () => {
                try {
                    const data = await fetchFunction();
                    
                    this.cache = data;
                    this.cacheTimestamp = Date.now();
                    console.log(`✅ [${this.cacheName}] 캐시 업데이트 완료`);
                    
                    return data;
                } catch (error) {
                    console.error(`❌ [${this.cacheName}] 데이터 조회 오류:`, error);
                    throw error;
                } finally {
                    this.isLoading = false;
                    this.loadingPromise = null;
                }
            })();

            return this.loadingPromise;
        }

        /**
         * 캐시 수동 설정
         */
        setCache(data) {
            this.cache = data;
            this.cacheTimestamp = Date.now();
            console.log(`💾 [${this.cacheName}] 캐시 수동 설정됨`);
        }

        /**
         * 현재 캐시 상태 확인
         */
        getStatus() {
            return {
                cacheName: this.cacheName,
                hasCache: !!this.cache,
                cacheAge: this.cacheTimestamp ? Date.now() - this.cacheTimestamp : null,
                isValid: this.isValid(),
                isLoading: this.isLoading
            };
        }
    }

    /**
     * 전역 캐시 매니저 팩토리
     */
    window.CacheManagerFactory = {
        instances: {},

        /**
         * 캐시 매니저 인스턴스 생성 또는 가져오기
         */
        getInstance(cacheName, options = {}) {
            if (!this.instances[cacheName]) {
                this.instances[cacheName] = new CacheManager({
                    cacheName,
                    ...options
                });
            }
            return this.instances[cacheName];
        },

        /**
         * 모든 캐시 무효화
         */
        invalidateAll() {
            console.log('🗑️ 모든 캐시 무효화');
            Object.values(this.instances).forEach(instance => {
                instance.invalidate();
            });
        },

        /**
         * 특정 캐시 무효화
         */
        invalidate(cacheName) {
            if (this.instances[cacheName]) {
                this.instances[cacheName].invalidate();
            }
        },

        /**
         * 모든 캐시 상태 확인
         */
        getAllStatus() {
            const status = {};
            Object.entries(this.instances).forEach(([name, instance]) => {
                status[name] = instance.getStatus();
            });
            return status;
        }
    };

    console.log('✅ CacheManager 유틸리티 로드 완료');

})();