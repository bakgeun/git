/**
 * 데이터베이스 관련 서비스
 * Firestore 데이터베이스 관련 CRUD 기능을 처리합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // dbService 네임스페이스 생성
    window.dbService = {
        /**
         * 컬렉션에서 문서 목록 가져오기
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {object} options - 추가 옵션 (정렬, 필터, 제한 등)
         * @returns {Promise} - 문서 목록을 포함한 프로미스
         */
        getDocuments: async function(collectionName, options = {}) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                let query = window.dhcFirebase.db.collection(collectionName);
                
                // 정렬 적용
                if (options.orderBy) {
                    if (Array.isArray(options.orderBy)) {
                        // 여러 필드로 정렬
                        options.orderBy.forEach(order => {
                            query = query.orderBy(order.field, order.direction || 'asc');
                        });
                    } else {
                        // 단일 필드로 정렬
                        query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
                    }
                }
                
                // 필터 적용
                if (options.where) {
                    if (Array.isArray(options.where)) {
                        // 여러 조건 필터
                        options.where.forEach(condition => {
                            query = query.where(condition.field, condition.operator, condition.value);
                        });
                    } else {
                        // 단일 조건 필터
                        query = query.where(options.where.field, options.where.operator, options.where.value);
                    }
                }
                
                // 문서 수 제한
                if (options.limit) {
                    query = query.limit(options.limit);
                }
                
                // 쿼리 실행
                const snapshot = await query.get();
                
                // 결과 처리
                const documents = [];
                snapshot.forEach(doc => {
                    documents.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                return { success: true, data: documents };
            } catch (error) {
                console.error(`${collectionName} 문서 가져오기 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 특정 문서 가져오기
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {string} documentId - 문서 ID
         * @returns {Promise} - 문서 데이터를 포함한 프로미스
         */
        getDocument: async function(collectionName, documentId) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                // 문서 가져오기
                const docRef = window.dhcFirebase.db.collection(collectionName).doc(documentId);
                const doc = await docRef.get();
                
                if (doc.exists) {
                    return {
                        success: true,
                        data: {
                            id: doc.id,
                            ...doc.data()
                        }
                    };
                } else {
                    return { success: false, error: { message: "문서를 찾을 수 없습니다." } };
                }
            } catch (error) {
                console.error(`${collectionName}/${documentId} 문서 가져오기 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 새 문서 추가하기
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {object} data - 문서 데이터
         * @param {string} customId - 사용자 지정 문서 ID (선택적)
         * @returns {Promise} - 추가된 문서 ID를 포함한 프로미스
         */
        addDocument: async function(collectionName, data, customId = null) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                // 타임스탬프 추가
                const dataWithTimestamp = {
                    ...data,
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };
                
                let docRef;
                
                // 사용자 지정 ID 사용 여부
                if (customId) {
                    docRef = window.dhcFirebase.db.collection(collectionName).doc(customId);
                    await docRef.set(dataWithTimestamp);
                } else {
                    docRef = await window.dhcFirebase.db.collection(collectionName).add(dataWithTimestamp);
                }
                
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error(`${collectionName} 문서 추가 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 문서 업데이트하기
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {string} documentId - 문서 ID
         * @param {object} data - 업데이트할 데이터
         * @returns {Promise} - 업데이트 결과 프로미스
         */
        updateDocument: async function(collectionName, documentId, data) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                // 업데이트 시간 추가
                const dataWithTimestamp = {
                    ...data,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // 문서 업데이트
                const docRef = window.dhcFirebase.db.collection(collectionName).doc(documentId);
                await docRef.update(dataWithTimestamp);
                
                return { success: true };
            } catch (error) {
                console.error(`${collectionName}/${documentId} 문서 업데이트 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 문서 삭제하기
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {string} documentId - 문서 ID
         * @returns {Promise} - 삭제 결과 프로미스
         */
        deleteDocument: async function(collectionName, documentId) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                // 문서 삭제
                await window.dhcFirebase.db.collection(collectionName).doc(documentId).delete();
                
                return { success: true };
            } catch (error) {
                console.error(`${collectionName}/${documentId} 문서 삭제 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 페이지네이션으로 문서 가져오기
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {object} options - 페이지네이션 옵션 (정렬, 필터, 페이지 크기 등)
         * @param {object} lastDoc - 마지막으로 가져온 문서 (다음 페이지용)
         * @returns {Promise} - 페이지네이션 결과 프로미스
         */
        getPaginatedDocuments: async function(collectionName, options = {}, lastDoc = null) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                const pageSize = options.pageSize || 10;
                let query = window.dhcFirebase.db.collection(collectionName);
                
                // 정렬 적용
                if (options.orderBy) {
                    if (Array.isArray(options.orderBy)) {
                        // 여러 필드로 정렬
                        options.orderBy.forEach(order => {
                            query = query.orderBy(order.field, order.direction || 'asc');
                        });
                    } else {
                        // 단일 필드로 정렬
                        query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
                    }
                } else {
                    // 기본 정렬 (생성일 기준 내림차순)
                    query = query.orderBy('createdAt', 'desc');
                }
                
                // 필터 적용
                if (options.where) {
                    if (Array.isArray(options.where)) {
                        // 여러 조건 필터
                        options.where.forEach(condition => {
                            query = query.where(condition.field, condition.operator, condition.value);
                        });
                    } else {
                        // 단일 조건 필터
                        query = query.where(options.where.field, options.where.operator, options.where.value);
                    }
                }
                
                // 시작점 설정 (이전 페이지의 마지막 문서)
                if (lastDoc) {
                    query = query.startAfter(lastDoc);
                }
                
                // 페이지 크기 제한
                query = query.limit(pageSize);
                
                // 쿼리 실행
                const snapshot = await query.get();
                
                // 결과 처리
                const documents = [];
                snapshot.forEach(doc => {
                    documents.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                // 다음 페이지 여부 확인
                const hasMore = documents.length === pageSize;
                
                // 마지막 문서 (다음 페이지 요청 시 사용)
                const lastVisible = snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null;
                
                return {
                    success: true,
                    data: documents,
                    hasMore: hasMore,
                    lastDoc: lastVisible
                };
            } catch (error) {
                console.error(`${collectionName} 페이지네이션 문서 가져오기 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 검색 기능 (특정 필드에서 텍스트 검색)
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {string} field - 검색할 필드
         * @param {string} searchText - 검색 텍스트
         * @param {object} options - 추가 옵션 (정렬, 제한 등)
         * @returns {Promise} - 검색 결과 프로미스
         */
        searchDocuments: async function(collectionName, field, searchText, options = {}) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                // 검색 텍스트가 없는 경우
                if (!searchText || searchText.trim() === '') {
                    return this.getDocuments(collectionName, options);
                }
                
                // 소문자로 변환하여 대소문자 구분 없는 검색
                const searchTextLower = searchText.toLowerCase();
                
                // Firestore는 부분 문자열 검색을 직접 지원하지 않으므로,
                // 전체 문서를 가져와서 클라이언트에서 필터링해야 함
                let query = window.dhcFirebase.db.collection(collectionName);
                
                // 정렬 적용
                if (options.orderBy) {
                    if (Array.isArray(options.orderBy)) {
                        options.orderBy.forEach(order => {
                            query = query.orderBy(order.field, order.direction || 'asc');
                        });
                    } else {
                        query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
                    }
                }
                
                // 필터 적용 (검색어 외의 추가 필터)
                if (options.where) {
                    if (Array.isArray(options.where)) {
                        options.where.forEach(condition => {
                            query = query.where(condition.field, condition.operator, condition.value);
                        });
                    } else {
                        query = query.where(options.where.field, options.where.operator, options.where.value);
                    }
                }
                
                // 최대 문서 수 제한 (검색 전)
                const maxResults = options.maxResults || 100;
                query = query.limit(maxResults);
                
                // 쿼리 실행
                const snapshot = await query.get();
                
                // 결과 클라이언트측 필터링
                const documents = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    
                    // 필드 값이 문자열인지 확인하고 소문자로 변환하여 검색
                    if (data[field] && typeof data[field] === 'string') {
                        const fieldValueLower = data[field].toLowerCase();
                        
                        if (fieldValueLower.includes(searchTextLower)) {
                            documents.push({
                                id: doc.id,
                                ...data
                            });
                        }
                    }
                });
                
                // 결과 수 제한 (검색 후)
                const limit = options.limit || documents.length;
                const limitedResults = documents.slice(0, limit);
                
                return { success: true, data: limitedResults };
            } catch (error) {
                console.error(`${collectionName} 문서 검색 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 집계 쿼리 - 문서 수 계산
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {object} options - 집계 옵션 (필터 등)
         * @returns {Promise} - 집계 결과 프로미스
         */
        countDocuments: async function(collectionName, options = {}) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                let query = window.dhcFirebase.db.collection(collectionName);
                
                // 필터 적용
                if (options.where) {
                    if (Array.isArray(options.where)) {
                        options.where.forEach(condition => {
                            query = query.where(condition.field, condition.operator, condition.value);
                        });
                    } else {
                        query = query.where(options.where.field, options.where.operator, options.where.value);
                    }
                }
                
                // 쿼리 실행
                const snapshot = await query.get();
                
                return { success: true, count: snapshot.size };
            } catch (error) {
                console.error(`${collectionName} 문서 수 계산 오류:`, error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 트랜잭션 실행
         * 
         * @param {function} transactionFunction - 트랜잭션 함수
         * @returns {Promise} - 트랜잭션 결과 프로미스
         */
        runTransaction: async function(transactionFunction) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                const result = await window.dhcFirebase.db.runTransaction(transactionFunction);
                
                return { success: true, data: result };
            } catch (error) {
                console.error("트랜잭션 실행 오류:", error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 배치 작업 실행
         * 
         * @param {function} batchFunction - 배치 작업 함수
         * @returns {Promise} - 배치 작업 결과 프로미스
         */
        runBatch: async function(batchFunction) {
            try {
                // Firebase가 초기화되어 있는지 확인
                if (!window.dhcFirebase || !window.dhcFirebase.db) {
                    return { success: false, error: { message: "Firebase가 초기화되지 않았습니다." } };
                }
                
                const batch = window.dhcFirebase.db.batch();
                batchFunction(batch);
                
                await batch.commit();
                
                return { success: true };
            } catch (error) {
                console.error("배치 작업 실행 오류:", error);
                return { success: false, error: error };
            }
        },
        
        /**
         * 실시간 문서 변경 감지
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {string} documentId - 문서 ID
         * @param {function} callback - 변경 감지 시 호출될 콜백 함수
         * @returns {function} - 리스너 해제 함수
         */
        onDocumentChange: function(collectionName, documentId, callback) {
            // Firebase가 초기화되어 있는지 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.error("Firebase가 초기화되지 않았습니다.");
                return () => {};
            }
            
            // 실시간 리스너 등록
            const unsubscribe = window.dhcFirebase.db.collection(collectionName).doc(documentId)
                .onSnapshot(
                    doc => {
                        if (doc.exists) {
                            callback({
                                success: true,
                                data: {
                                    id: doc.id,
                                    ...doc.data()
                                }
                            });
                        } else {
                            callback({
                                success: false,
                                error: { message: "문서가 존재하지 않습니다." }
                            });
                        }
                    },
                    error => {
                        console.error(`${collectionName}/${documentId} 문서 변경 감지 오류:`, error);
                        callback({
                            success: false,
                            error: error
                        });
                    }
                );
            
            // 리스너 해제 함수 반환
            return unsubscribe;
        },
        
        /**
         * 실시간 컬렉션 변경 감지
         * 
         * @param {string} collectionName - 컬렉션 이름
         * @param {object} options - 감지 옵션 (정렬, 필터 등)
         * @param {function} callback - 변경 감지 시 호출될 콜백 함수
         * @returns {function} - 리스너 해제 함수
         */
        onCollectionChange: function(collectionName, options = {}, callback) {
            // Firebase가 초기화되어 있는지 확인
            if (!window.dhcFirebase || !window.dhcFirebase.db) {
                console.error("Firebase가 초기화되지 않았습니다.");
                return () => {};
            }
            
            let query = window.dhcFirebase.db.collection(collectionName);
            
            // 정렬 적용
            if (options.orderBy) {
                if (Array.isArray(options.orderBy)) {
                    options.orderBy.forEach(order => {
                        query = query.orderBy(order.field, order.direction || 'asc');
                    });
                } else {
                    query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
                }
            }
            
            // 필터 적용
            if (options.where) {
                if (Array.isArray(options.where)) {
                    options.where.forEach(condition => {
                        query = query.where(condition.field, condition.operator, condition.value);
                    });
                } else {
                    query = query.where(options.where.field, options.where.operator, options.where.value);
                }
            }
            
            // 문서 수 제한
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            // 실시간 리스너 등록
            const unsubscribe = query.onSnapshot(
                snapshot => {
                    const documents = [];
                    snapshot.forEach(doc => {
                        documents.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    callback({
                        success: true,
                        data: documents
                    });
                },
                error => {
                    console.error(`${collectionName} 컬렉션 변경 감지 오류:`, error);
                    callback({
                        success: false,
                        error: error
                    });
                }
            );
            
            // 리스너 해제 함수 반환
            return unsubscribe;
        }
    };
})();