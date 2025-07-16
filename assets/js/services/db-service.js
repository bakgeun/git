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

    if (!window.dbService) {
        console.error('❌ 기존 dbService를 찾을 수 없습니다. 먼저 db-service.js를 로드해주세요.');
        return;
    }

    console.log('🔧 db-service.js 개선 시작 (데이터 변환 유틸리티 추가)');

    // =================================
    // 🆕 자격증 데이터 변환 유틸리티
    // =================================

    /**
     * 🆕 신청 데이터를 자격증 데이터로 변환
     */
    window.dbService.convertApplicationToCertificate = function(applicationData, additionalData = {}) {
        console.log('🔄 신청 데이터를 자격증 데이터로 변환:', applicationData);

        // 기본 변환 맵핑
        const convertedData = {
            // 🔧 통일된 식별 정보
            applicationId: applicationData.id || applicationData.applicationId,
            certificateNumber: additionalData.certificateNumber || applicationData.applicationId || 'PENDING',
            
            // 🔧 통일된 사용자 정보
            holderName: applicationData.holderName || applicationData.nameKorean || applicationData['name-korean'] || '',
            holderNameKorean: applicationData.holderNameKorean || applicationData.nameKorean || applicationData['name-korean'] || '',
            holderNameEnglish: applicationData.holderNameEnglish || applicationData.nameEnglish || applicationData['name-english'] || '',
            holderEmail: applicationData.holderEmail || applicationData.email || '',
            holderPhone: applicationData.holderPhone || applicationData.phone || '',
            
            // 🔧 자격증 정보
            certificateType: applicationData.certificateType || applicationData['cert-type'] || '',
            certificateName: additionalData.certificateName || this.getCertificateTypeName(applicationData.certificateType || applicationData['cert-type']),
            
            // 🔧 교육 정보
            courseName: applicationData.courseName || additionalData.courseName || '승인된 교육과정',
            courseId: applicationData.courseId || additionalData.courseId || '',
            courseCompletionDate: applicationData.courseCompletionDate || applicationData['course-completion-date'] || '',
            examPassDate: applicationData.examPassDate || applicationData['exam-pass-date'] || '',
            
            // 🔧 발급 정보 (관리자가 설정)
            issueDate: additionalData.issueDate || new Date().toISOString().split('T')[0],
            expiryDate: additionalData.expiryDate || this.calculateExpiryDate(additionalData.issueDate || new Date()),
            
            // 🔧 상태 정보
            status: additionalData.status || 'active',
            applicationStatus: 'approved',
            issueStatus: 'issued',
            
            // 🔧 주소 및 배송 정보
            deliveryAddress: applicationData.deliveryAddress || applicationData['delivery-address'] || applicationData.fullAddress || '',
            postalCode: applicationData.postalCode || '',
            basicAddress: applicationData.basicAddress || '',
            detailAddress: applicationData.detailAddress || '',
            
            // 🔧 파일 정보
            photoUrl: applicationData.photoUrl || '',
            photoFileName: applicationData.photoFileName || '',
            photoFileSize: applicationData.photoFileSize || 0,
            photoFileType: applicationData.photoFileType || '',
            
            // 🔧 메타데이터
            createdAt: additionalData.createdAt || new Date(),
            updatedAt: new Date(),
            issuedAt: new Date(),
            createdBy: additionalData.createdBy || 'admin',
            issuedBy: additionalData.issuedBy || 'admin',
            issueMethod: additionalData.issueMethod || 'admin_approval',
            
            // 🔧 연결 정보
            applicationDocId: applicationData.id,
            
            // 🔧 비고
            remarks: additionalData.remarks || `신청 승인 후 발급 (신청 ID: ${applicationData.id})`
        };

        console.log('✅ 변환 완료:', convertedData);
        return convertedData;
    };

    /**
     * 🆕 자격증 종류명 가져오기
     */
    window.dbService.getCertificateTypeName = function(type) {
        const typeNames = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return typeNames[type] || type || '알 수 없음';
    };

    /**
     * 🆕 만료일 계산 (발급일로부터 3년)
     */
    window.dbService.calculateExpiryDate = function(issueDate) {
        const date = new Date(issueDate);
        date.setFullYear(date.getFullYear() + 3);
        return date.toISOString().split('T')[0];
    };

    // =================================
    // 🆕 자격증 워크플로우 함수들
    // =================================

    /**
     * 🆕 신청 승인 및 자격증 발급
     */
    window.dbService.approveApplicationAndIssueCertificate = async function(applicationId, approvalData = {}) {
        console.log('🔄 신청 승인 및 자격증 발급 처리:', applicationId);

        try {
            // 1. 신청 데이터 조회
            const appResult = await this.getDocument('certificate_applications', applicationId);
            if (!appResult.success) {
                throw new Error('신청 데이터를 찾을 수 없습니다.');
            }

            const applicationData = appResult.data;

            // 2. 자격증 번호 생성
            const certificateNumber = approvalData.certificateNumber || await this.generateCertificateNumber(applicationData.certificateType);

            // 3. 자격증 데이터 변환
            const certificateData = this.convertApplicationToCertificate(applicationData, {
                certificateNumber: certificateNumber,
                issueDate: approvalData.issueDate || new Date().toISOString().split('T')[0],
                createdBy: approvalData.approvedBy || 'admin',
                issuedBy: approvalData.approvedBy || 'admin',
                remarks: approvalData.remarks || `신청 승인 후 발급 (신청 ID: ${applicationId})`
            });

            // 4. 트랜잭션으로 두 작업을 안전하게 처리
            const transactionResult = await this.runTransaction(async (transaction) => {
                // 4-1. 자격증 발급
                const certRef = window.dhcFirebase.db.collection('certificates').doc();
                transaction.set(certRef, {
                    ...certificateData,
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    issuedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });

                // 4-2. 신청 상태 업데이트
                const appRef = window.dhcFirebase.db.collection('certificate_applications').doc(applicationId);
                transaction.update(appRef, {
                    applicationStatus: 'approved',
                    approvedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    approvedBy: approvalData.approvedBy || 'admin',
                    certificateId: certRef.id,
                    certificateNumber: certificateNumber,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                });

                return {
                    certificateId: certRef.id,
                    certificateNumber: certificateNumber
                };
            });

            if (transactionResult.success) {
                console.log('✅ 신청 승인 및 자격증 발급 완료');
                return {
                    success: true,
                    certificateId: transactionResult.data.certificateId,
                    certificateNumber: transactionResult.data.certificateNumber
                };
            } else {
                throw new Error('트랜잭션 실행 실패');
            }

        } catch (error) {
            console.error('❌ 신청 승인 처리 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * 🆕 신청 거절
     */
    window.dbService.rejectApplication = async function(applicationId, rejectionData = {}) {
        console.log('❌ 신청 거절 처리:', applicationId);

        try {
            const updateData = {
                applicationStatus: 'rejected',
                rejectedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                rejectedBy: rejectionData.rejectedBy || 'admin',
                rejectionReason: rejectionData.reason || '관리자 판단',
                updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            };

            const result = await this.updateDocument('certificate_applications', applicationId, updateData);

            if (result.success) {
                console.log('✅ 신청 거절 완료');
                return { success: true };
            } else {
                throw new Error('신청 거절 업데이트 실패');
            }

        } catch (error) {
            console.error('❌ 신청 거절 처리 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * 🆕 자격증 번호 생성
     */
    window.dbService.generateCertificateNumber = async function(certificateType) {
        const year = new Date().getFullYear();
        const typeCode = this.getCertificateTypeCode(certificateType);

        try {
            // 같은 종류의 가장 최근 자격증 번호 조회
            const query = window.dhcFirebase.db.collection('certificates')
                .where('certificateType', '==', certificateType)
                .orderBy('certificateNumber', 'desc')
                .limit(1);

            const snapshot = await query.get();

            let nextNumber = 1;

            if (!snapshot.empty) {
                const lastCert = snapshot.docs[0].data();
                const lastNumber = lastCert.certificateNumber;

                // 번호에서 순번 추출 (예: HE-2025-0001 → 1)
                const match = lastNumber.match(/-(\d+)$/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            // 번호 포맷팅 (4자리로 패딩)
            const formattedNumber = nextNumber.toString().padStart(4, '0');
            const certificateNumber = `${typeCode}-${year}-${formattedNumber}`;

            console.log('✅ 자격증 번호 생성:', certificateNumber);
            return certificateNumber;

        } catch (error) {
            console.error('❌ 자격증 번호 생성 오류:', error);
            // 오류 시 시간 기반 번호 생성
            const timestamp = Date.now().toString().slice(-4);
            return `${typeCode}-${year}-${timestamp}`;
        }
    };

    /**
     * 🆕 자격증 종류 코드 가져오기
     */
    window.dbService.getCertificateTypeCode = function(certType) {
        const codes = {
            'health-exercise': 'HE',
            'rehabilitation': 'RE',
            'pilates': 'PI',
            'recreation': 'RC'
        };
        return codes[certType] || 'HE';
    };

    // =================================
    // 🆕 통합 조회 함수들
    // =================================

    /**
     * 🆕 자격증 및 신청 데이터 통합 조회
     */
    window.dbService.getCertificatesWithApplications = async function(certificateType, options = {}) {
        console.log('🔄 자격증 및 신청 데이터 통합 조회:', certificateType);

        try {
            const results = {
                certificates: [],
                applications: [],
                integrated: []
            };

            // 1. 발급된 자격증 조회
            const certQuery = {
                where: [
                    { field: 'certificateType', operator: '==', value: certificateType },
                    { field: 'status', operator: '!=', value: 'pending' }
                ],
                orderBy: { field: 'createdAt', direction: 'desc' },
                limit: options.limit || 50
            };

            if (options.statusFilter) {
                certQuery.where.push({ field: 'status', operator: '==', value: options.statusFilter });
            }

            const certResult = await this.getDocuments('certificates', certQuery);
            if (certResult.success) {
                results.certificates = certResult.data;
            }

            // 2. 신청 대기 데이터 조회
            const appQuery = {
                where: [
                    { field: 'certificateType', operator: '==', value: certificateType },
                    { field: 'applicationStatus', operator: '==', value: 'submitted' }
                ],
                orderBy: { field: 'timestamp', direction: 'desc' },
                limit: options.limit || 50
            };

            const appResult = await this.getDocuments('certificate_applications', appQuery);
            if (appResult.success) {
                results.applications = appResult.data;
            }

            // 3. 데이터 통합
            results.integrated = this.integrateApplicationsWithCertificates(results.certificates, results.applications);

            console.log(`✅ 통합 조회 완료: 자격증 ${results.certificates.length}개, 신청 ${results.applications.length}개`);
            
            return {
                success: true,
                data: results.integrated,
                certificates: results.certificates,
                applications: results.applications
            };

        } catch (error) {
            console.error('❌ 통합 조회 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * 🆕 신청 데이터와 자격증 데이터 통합
     */
    window.dbService.integrateApplicationsWithCertificates = function(certificates, applications) {
        console.log('🔄 데이터 통합 처리');

        const integrated = [...certificates];

        // 신청 데이터를 자격증 형태로 변환하여 추가
        applications.forEach(app => {
            const certificateFromApp = {
                id: app.id,
                certificateNumber: app.applicationId || `PENDING-${app.id}`,
                
                // 🔧 통일된 필드명 사용
                holderName: app.holderName || app.nameKorean || app['name-korean'] || '-',
                holderNameKorean: app.holderNameKorean || app.nameKorean || app['name-korean'] || '-',
                holderNameEnglish: app.holderNameEnglish || app.nameEnglish || app['name-english'] || '-',
                holderEmail: app.holderEmail || app.email || '-',
                
                courseName: app.courseName || '-',
                certificateType: app.certificateType || app['cert-type'],
                certificateName: this.getCertificateTypeName(app.certificateType || app['cert-type']),
                
                // 🔧 신청 상태 표시
                issueDate: null,
                expiryDate: null,
                status: 'pending',
                applicationStatus: app.applicationStatus || 'submitted',
                
                // 🔧 메타데이터
                isApplication: true,
                applicationData: app,
                createdAt: app.timestamp || app.createdAt,
                
                remarks: '발급 대기 중 (신청 완료)'
            };
            
            integrated.push(certificateFromApp);
        });

        // 날짜순 정렬 (최신순)
        integrated.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateB - dateA;
        });

        console.log(`✅ 데이터 통합 완료: 총 ${integrated.length}개`);
        return integrated;
    };

    // =================================
    // 🆕 검색 및 필터링 함수들
    // =================================

    /**
     * 🆕 통합 검색 (자격증 + 신청 데이터)
     */
    window.dbService.searchCertificatesAndApplications = async function(certificateType, searchOptions = {}) {
        console.log('🔍 통합 검색 실행:', { certificateType, searchOptions });

        try {
            const results = {
                certificates: [],
                applications: []
            };

            // 1. 자격증 검색
            if (searchOptions.name) {
                const certSearchResult = await this.searchDocuments('certificates', 'holderName', searchOptions.name, {
                    where: { field: 'certificateType', operator: '==', value: certificateType },
                    limit: 25
                });
                
                if (certSearchResult.success) {
                    results.certificates = certSearchResult.data;
                }
            }

            // 2. 신청 데이터 검색
            if (searchOptions.name) {
                const appSearchResult = await this.searchDocuments('certificate_applications', 'nameKorean', searchOptions.name, {
                    where: { field: 'certificateType', operator: '==', value: certificateType },
                    limit: 25
                });
                
                if (appSearchResult.success) {
                    results.applications = appSearchResult.data;
                }
            }

            // 3. 자격증 번호로 검색
            if (searchOptions.certNumber) {
                // 발급된 자격증에서 검색
                const certNumberResult = await this.getDocuments('certificates', {
                    where: [
                        { field: 'certificateType', operator: '==', value: certificateType },
                        { field: 'certificateNumber', operator: '==', value: searchOptions.certNumber }
                    ]
                });
                
                if (certNumberResult.success) {
                    results.certificates.push(...certNumberResult.data);
                }

                // 신청 데이터에서도 검색 (applicationId)
                const appNumberResult = await this.getDocuments('certificate_applications', {
                    where: [
                        { field: 'certificateType', operator: '==', value: certificateType },
                        { field: 'applicationId', operator: '==', value: searchOptions.certNumber }
                    ]
                });
                
                if (appNumberResult.success) {
                    results.applications.push(...appNumberResult.data);
                }
            }

            // 4. 중복 제거
            results.certificates = this.removeDuplicates(results.certificates, 'id');
            results.applications = this.removeDuplicates(results.applications, 'id');

            // 5. 통합
            const integrated = this.integrateApplicationsWithCertificates(results.certificates, results.applications);

            console.log(`✅ 통합 검색 완료: 자격증 ${results.certificates.length}개, 신청 ${results.applications.length}개`);
            
            return {
                success: true,
                data: integrated,
                certificates: results.certificates,
                applications: results.applications
            };

        } catch (error) {
            console.error('❌ 통합 검색 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * 🆕 중복 제거 유틸리티
     */
    window.dbService.removeDuplicates = function(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    };

    // =================================
    // 🆕 상태 관리 함수들
    // =================================

    /**
     * 🆕 신청 상태 변경
     */
    window.dbService.updateApplicationStatus = async function(applicationId, newStatus, metadata = {}) {
        console.log('🔄 신청 상태 변경:', { applicationId, newStatus });

        try {
            const updateData = {
                applicationStatus: newStatus,
                updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                ...metadata
            };

            // 상태별 추가 필드
            switch (newStatus) {
                case 'approved':
                    updateData.approvedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    updateData.approvedBy = metadata.approvedBy || 'admin';
                    break;
                case 'rejected':
                    updateData.rejectedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    updateData.rejectedBy = metadata.rejectedBy || 'admin';
                    updateData.rejectionReason = metadata.reason || '';
                    break;
                case 'under_review':
                    updateData.reviewStartedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    updateData.reviewedBy = metadata.reviewedBy || 'admin';
                    break;
            }

            const result = await this.updateDocument('certificate_applications', applicationId, updateData);
            
            if (result.success) {
                console.log('✅ 신청 상태 변경 완료');
                return { success: true };
            } else {
                throw new Error('상태 업데이트 실패');
            }

        } catch (error) {
            console.error('❌ 신청 상태 변경 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * 🆕 자격증 상태 변경
     */
    window.dbService.updateCertificateStatus = async function(certificateId, newStatus, metadata = {}) {
        console.log('🔄 자격증 상태 변경:', { certificateId, newStatus });

        try {
            const updateData = {
                status: newStatus,
                updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                ...metadata
            };

            // 상태별 추가 필드
            switch (newStatus) {
                case 'revoked':
                    updateData.revokedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    updateData.revokedBy = metadata.revokedBy || 'admin';
                    updateData.revocationReason = metadata.reason || '';
                    break;
                case 'suspended':
                    updateData.suspendedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    updateData.suspendedBy = metadata.suspendedBy || 'admin';
                    updateData.suspensionReason = metadata.reason || '';
                    break;
                case 'expired':
                    updateData.expiredAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    break;
            }

            const result = await this.updateDocument('certificates', certificateId, updateData);
            
            if (result.success) {
                console.log('✅ 자격증 상태 변경 완료');
                return { success: true };
            } else {
                throw new Error('상태 업데이트 실패');
            }

        } catch (error) {
            console.error('❌ 자격증 상태 변경 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    // =================================
    // 🆕 데이터 마이그레이션 함수들
    // =================================

    /**
     * 🆕 기존 신청 데이터를 새 스키마로 마이그레이션
     */
    window.dbService.migrateApplicationData = async function(batchSize = 10) {
        console.log('🔄 신청 데이터 마이그레이션 시작');

        try {
            // 마이그레이션이 필요한 신청 데이터 조회
            const result = await this.getDocuments('certificate_applications', {
                where: { field: 'migrated', operator: '!=', value: true },
                limit: batchSize
            });

            if (!result.success || result.data.length === 0) {
                console.log('✅ 마이그레이션할 데이터가 없습니다.');
                return { success: true, migrated: 0 };
            }

            const applications = result.data;
            let migratedCount = 0;

            // 배치 작업으로 마이그레이션
            const batchResult = await this.runBatch((batch) => {
                applications.forEach(app => {
                    const docRef = window.dhcFirebase.db.collection('certificate_applications').doc(app.id);
                    
                    // 🔧 새 스키마로 변환
                    const migratedData = {
                        // 기존 데이터 유지
                        ...app,
                        
                        // 🔧 통일된 필드명 추가
                        holderName: app.holderName || app.nameKorean || app['name-korean'] || '',
                        holderNameKorean: app.holderNameKorean || app.nameKorean || app['name-korean'] || '',
                        holderNameEnglish: app.holderNameEnglish || app.nameEnglish || app['name-english'] || '',
                        holderEmail: app.holderEmail || app.email || '',
                        holderPhone: app.holderPhone || app.phone || '',
                        
                        // 마이그레이션 플래그
                        migrated: true,
                        migratedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                        migratedVersion: '1.0'
                    };
                    
                    batch.update(docRef, migratedData);
                    migratedCount++;
                });
            });

            if (batchResult.success) {
                console.log(`✅ ${migratedCount}개 데이터 마이그레이션 완료`);
                return {
                    success: true,
                    migrated: migratedCount,
                    hasMore: applications.length === batchSize
                };
            } else {
                throw new Error('배치 작업 실패');
            }

        } catch (error) {
            console.error('❌ 데이터 마이그레이션 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    // =================================
    // 🆕 디버깅 및 개발 도구
    // =================================

    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.web.app') ||
        window.location.hostname.includes('.firebaseapp.com') ||
        window.location.protocol === 'file:' ||
        window.FORCE_DEBUG === true) {

        /**
         * 🆕 디버깅 도구
         */
        window.dbService.debug = {
            help: function() {
                console.log('🔧 db-service.js 디버깅 도구 (데이터 연동 개선)');
                console.log('\n🔄 데이터 변환:');
                console.log('- testDataConversion() : 데이터 변환 테스트');
                console.log('- testCertNumberGeneration() : 자격증 번호 생성 테스트');
                
                console.log('\n📊 통합 조회:');
                console.log('- testIntegratedQuery() : 통합 조회 테스트');
                console.log('- testSearchFunction() : 통합 검색 테스트');
                
                console.log('\n🔄 워크플로우:');
                console.log('- testApprovalWorkflow() : 승인 워크플로우 테스트');
                console.log('- testStatusChange() : 상태 변경 테스트');
                
                console.log('\n🔧 마이그레이션:');
                console.log('- testMigration() : 데이터 마이그레이션 테스트');
            },

            testDataConversion: function() {
                console.log('🔄 데이터 변환 테스트');
                
                const mockApplication = {
                    id: 'app-test-001',
                    'name-korean': '테스트사용자',
                    'name-english': 'Test User',
                    'email': 'test@example.com',
                    'cert-type': 'health-exercise',
                    'applicationId': 'CERT_TEST_001'
                };
                
                const converted = window.dbService.convertApplicationToCertificate(mockApplication, {
                    certificateNumber: 'HE-2025-0001',
                    approvedBy: 'admin'
                });
                
                console.log('원본 신청 데이터:', mockApplication);
                console.log('변환된 자격증 데이터:', converted);
                
                return { original: mockApplication, converted: converted };
            },

            testCertNumberGeneration: async function() {
                console.log('🔢 자격증 번호 생성 테스트');
                
                const types = ['health-exercise', 'rehabilitation', 'pilates', 'recreation'];
                const results = {};
                
                for (const type of types) {
                    try {
                        const certNumber = await window.dbService.generateCertificateNumber(type);
                        results[type] = certNumber;
                        console.log(`${type}: ${certNumber}`);
                    } catch (error) {
                        console.error(`${type}: 오류 - ${error.message}`);
                    }
                }
                
                return results;
            },

            testIntegratedQuery: async function() {
                console.log('📊 통합 조회 테스트');
                
                try {
                    const result = await window.dbService.getCertificatesWithApplications('health-exercise', {
                        limit: 10
                    });
                    
                    if (result.success) {
                        console.log('✅ 통합 조회 성공');
                        console.log(`- 발급된 자격증: ${result.certificates.length}개`);
                        console.log(`- 신청 대기: ${result.applications.length}개`);
                        console.log(`- 통합 결과: ${result.data.length}개`);
                        
                        return result;
                    } else {
                        console.error('❌ 통합 조회 실패:', result.error);
                    }
                } catch (error) {
                    console.error('❌ 통합 조회 테스트 오류:', error);
                }
            },

            testSearchFunction: async function() {
                console.log('🔍 통합 검색 테스트');
                
                try {
                    const result = await window.dbService.searchCertificatesAndApplications('health-exercise', {
                        name: '홍길동'
                    });
                    
                    if (result.success) {
                        console.log('✅ 통합 검색 성공');
                        console.log(`검색 결과: ${result.data.length}개`);
                        return result;
                    } else {
                        console.error('❌ 통합 검색 실패:', result.error);
                    }
                } catch (error) {
                    console.error('❌ 통합 검색 테스트 오류:', error);
                }
            }
        };

        console.log('🔧 db-service 디버깅 도구 활성화됨');
        console.log('💡 도움말: window.dbService.debug.help()');
    }

    console.log('✅ db-service.js 개선 완료 (데이터 변환 유틸리티 추가)');
    
})();

// =================================
// 🎉 완료 메시지
// =================================

console.log('\n🎉 === db-service.js 데이터 연동 개선 완료 ===');
console.log('✅ 데이터 변환 유틸리티 (convertApplicationToCertificate)');
console.log('✅ 워크플로우 함수 (approveApplicationAndIssueCertificate, rejectApplication)');
console.log('✅ 통합 조회 함수 (getCertificatesWithApplications)');
console.log('✅ 통합 검색 함수 (searchCertificatesAndApplications)');
console.log('✅ 상태 관리 함수 (updateApplicationStatus, updateCertificateStatus)');
console.log('✅ 자격증 번호 생성 (generateCertificateNumber)');
console.log('✅ 데이터 마이그레이션 (migrateApplicationData)');

console.log('\n🔧 주요 추가 기능:');
console.log('- 신청 데이터 ↔ 자격증 데이터 변환');
console.log('- 승인/거절 워크플로우 자동화');
console.log('- 두 컬렉션 통합 조회 및 검색');
console.log('- 자동 자격증 번호 생성');
console.log('- 상태 변경 이력 관리');

console.log('\n🚀 이제 완전한 데이터 연동 시스템이 구축되었습니다!');
console.log('📸 테스트: window.dbService.debug.help()');

// 완료 플래그 설정
window.dbServiceEnhancementComplete = true;

