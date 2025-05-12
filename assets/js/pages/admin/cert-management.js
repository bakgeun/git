/**
 * 자격증 관리 페이지 스크립트
 */

// 자격증 관리 객체
const certManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    
    /**
     * 자격증 목록 로드
     */
    loadCertificates: async function() {
        adminUtils.showLoadingOverlay(true);
        
        try {
            // 필터 옵션 설정
            const options = {
                orderBy: { field: 'createdAt', direction: 'desc' },
                pageSize: this.pageSize
            };
            
            // 필터 적용
            if (this.filters.certificateType) {
                options.where = options.where || [];
                options.where.push({ field: 'certificateType', operator: '==', value: this.filters.certificateType });
            }
            
            if (this.filters.status) {
                options.where = options.where || [];
                options.where.push({ field: 'status', operator: '==', value: this.filters.status });
            }
            
            // 날짜 필터
            if (this.filters.startDate) {
                options.where = options.where || [];
                options.where.push({ field: 'issueDate', operator: '>=', value: new Date(this.filters.startDate) });
            }
            
            if (this.filters.endDate) {
                options.where = options.where || [];
                options.where.push({ field: 'issueDate', operator: '<=', value: new Date(this.filters.endDate) });
            }
            
            // 검색어 필터 (자격증 번호 또는 수료자명)
            let searchResults;
            if (this.filters.searchKeyword) {
                // 자격증 번호로 검색
                const certNumberResults = await dbService.searchDocuments('certificates', 'certificateNumber', this.filters.searchKeyword, options);
                // 수료자명으로 검색
                const nameResults = await dbService.searchDocuments('certificates', 'holderName', this.filters.searchKeyword, options);
                
                // 결과 병합 및 중복 제거
                const allResults = [...(certNumberResults.data || []), ...(nameResults.data || [])];
                const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
                searchResults = { success: true, data: uniqueResults };
            } else {
                // 일반 조회
                searchResults = await dbService.getPaginatedDocuments('certificates', options, this.currentPage > 1 ? this.lastDoc : null);
            }
            
            if (searchResults.success) {
                // 테이블 업데이트
                this.updateCertTable(searchResults.data);
                
                // 페이지네이션 업데이트
                if (!this.filters.searchKeyword) {
                    this.lastDoc = searchResults.lastDoc;
                    
                    // 전체 자격증 수 계산
                    const totalCount = await dbService.countDocuments('certificates', { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);
                    
                    adminUtils.createPagination('cert-pagination', this.currentPage, totalPages, 'certManager.changePage');
                }
            } else {
                console.error('자격증 목록 로드 실패:', searchResults.error);
                adminAuth.showNotification('자격증 목록을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('자격증 목록 로드 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 자격증 테이블 업데이트
     */
    updateCertTable: function(certificates) {
        const columns = {
            certificateNumber: { label: '자격증 번호' },
            certificateType: { 
                label: '자격증 종류',
                formatter: (value) => {
                    const types = {
                        'health-exercise': '건강운동처방사',
                        'rehabilitation': '운동재활전문가',
                        'pilates': '필라테스 전문가',
                        'recreation': '레크리에이션지도자'
                    };
                    return types[value] || value;
                }
            },
            holderName: { label: '수료자명' },
            issueDate: { 
                label: '발급일',
                formatter: (value) => value ? formatters.formatDate(value.toDate()) : '-'
            },
            expiryDate: { 
                label: '만료일',
                formatter: (value) => value ? formatters.formatDate(value.toDate()) : '-'
            },
            status: { 
                label: '상태',
                formatter: (value) => {
                    const statusBadge = {
                        'active': '<span class="admin-badge admin-badge-success">유효</span>',
                        'expired': '<span class="admin-badge admin-badge-danger">만료</span>',
                        'revoked': '<span class="admin-badge admin-badge-warning">취소</span>'
                    };
                    return statusBadge[value] || value;
                }
            }
        };
        
        const actions = [
            { label: '상세', type: 'info', handler: 'certManager.viewCertificate' },
            { label: '수정', type: 'primary', handler: 'certManager.editCertificate' },
            { label: 'PDF', type: 'success', handler: 'certManager.downloadPdf' },
            { label: '취소', type: 'danger', handler: 'certManager.revokeCertificate' }
        ];
        
        adminUtils.createDataTable('cert-table', certificates, columns, { actions });
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadCertificates();
    },
    
    /**
     * 자격증 발급 모달 표시
     */
    showAddCertModal: async function() {
        // 사용 가능한 교육 과정 목록 조회
        const courses = await dbService.getDocuments('courses', {
            where: { field: 'status', operator: '==', value: 'completed' },
            orderBy: { field: 'endDate', direction: 'desc' }
        });
        
        const courseOptions = courses.success ? 
            courses.data.map(course => `<option value="${course.id}">${course.title} (${formatters.formatDate(course.startDate.toDate())} ~ ${formatters.formatDate(course.endDate.toDate())})</option>`).join('') :
            '<option value="">교육 과정이 없습니다.</option>';
        
        const modalContent = `
            <form id="cert-form" onsubmit="certManager.handleAddCertificate(event)">
                <div class="admin-form-group">
                    <label class="admin-form-label">교육 과정 <span class="text-red-500">*</span></label>
                    <select name="courseId" class="admin-form-control" required onchange="certManager.loadCourseParticipants(this.value)">
                        <option value="">선택하세요</option>
                        ${courseOptions}
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">수료자 <span class="text-red-500">*</span></label>
                    <select name="userId" class="admin-form-control" required disabled>
                        <option value="">먼저 교육 과정을 선택하세요</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">발급일 <span class="text-red-500">*</span></label>
                    <input type="date" name="issueDate" class="admin-form-control" value="${formatters.formatDateToInput(new Date())}" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">만료일 <span class="text-red-500">*</span></label>
                    <input type="date" name="expiryDate" class="admin-form-control" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">비고</label>
                    <textarea name="remarks" rows="3" class="admin-form-control"></textarea>
                </div>
            </form>
        `;
        
        adminUtils.showModal({
            title: '자격증 발급',
            content: modalContent,
            buttons: [
                { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                { label: '발급', type: 'primary', handler: 'document.getElementById("cert-form").submit()' }
            ]
        });
    },
    
    /**
     * 교육 과정 수료자 로드
     */
    loadCourseParticipants: async function(courseId) {
        const userSelect = document.querySelector('select[name="userId"]');
        
        if (!courseId) {
            userSelect.innerHTML = '<option value="">먼저 교육 과정을 선택하세요</option>';
            userSelect.disabled = true;
            return;
        }
        
        try {
            // 해당 교육 과정의 수료자 조회
            const enrollments = await dbService.getDocuments('enrollments', {
                where: [
                    { field: 'courseId', operator: '==', value: courseId },
                    { field: 'status', operator: '==', value: 'completed' }
                ]
            });
            
            if (enrollments.success && enrollments.data.length > 0) {
                // 사용자 정보 조회
                const userPromises = enrollments.data.map(enrollment => 
                    dbService.getDocument('users', enrollment.userId)
                );
                const users = await Promise.all(userPromises);
                
                // 교육 과정 정보 조회
                const courseDoc = await dbService.getDocument('courses', courseId);
                const certificateType = courseDoc.success ? courseDoc.data.certificateType : '';
                
                userSelect.innerHTML = '<option value="">선택하세요</option>' + 
                    enrollments.data.map((enrollment, index) => {
                        const user = users[index].success ? users[index].data : null;
                        return user ? 
                            `<option value="${user.id}" data-name="${user.displayName}" data-certificate-type="${certificateType}">${user.displayName} (${user.email})</option>` : 
                            '';
                    }).join('');
                
                userSelect.disabled = false;
            } else {
                userSelect.innerHTML = '<option value="">수료자가 없습니다.</option>';
                userSelect.disabled = true;
            }
        } catch (error) {
            console.error('수료자 로드 오류:', error);
            userSelect.innerHTML = '<option value="">수료자 로드 실패</option>';
            userSelect.disabled = true;
        }
    },
    
    /**
     * 자격증 발급 처리
     */
    handleAddCertificate: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            // 선택된 사용자 정보 가져오기
            const userSelect = form.querySelector('select[name="userId"]');
            const selectedOption = userSelect.options[userSelect.selectedIndex];
            const holderName = selectedOption.getAttribute('data-name');
            const certificateType = selectedOption.getAttribute('data-certificate-type');
            
            // 자격증 번호 생성 (예: HE-2025-0001)
            const typePrefix = {
                'health-exercise': 'HE',
                'rehabilitation': 'RE',
                'pilates': 'PI',
                'recreation': 'RC'
            }[certificateType] || 'XX';
            
            const year = new Date().getFullYear();
            const count = await this.getCertificateCount(certificateType, year);
            const certificateNumber = `${typePrefix}-${year}-${String(count + 1).padStart(4, '0')}`;
            
            // 자격증 데이터 준비
            const certData = {
                certificateNumber: certificateNumber,
                certificateType: certificateType,
                courseId: formData.get('courseId'),
                userId: formData.get('userId'),
                holderName: holderName,
                issueDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(formData.get('issueDate'))),
                expiryDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(formData.get('expiryDate'))),
                status: 'active',
                remarks: formData.get('remarks') || ''
            };
            
            const result = await dbService.addDocument('certificates', certData);
            
            if (result.success) {
                adminAuth.showNotification('자격증이 발급되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadCertificates();
            } else {
                adminAuth.showNotification('자격증 발급에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('자격증 발급 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 자격증 수 조회 (번호 생성용)
     */
    getCertificateCount: async function(certificateType, year) {
        try {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            
            const count = await dbService.countDocuments('certificates', {
                where: [
                    { field: 'certificateType', operator: '==', value: certificateType },
                    { field: 'issueDate', operator: '>=', value: startOfYear },
                    { field: 'issueDate', operator: '<', value: endOfYear }
                ]
            });
            
            return count.success ? count.count : 0;
        } catch (error) {
            console.error('자격증 수 조회 오류:', error);
            return 0;
        }
    },
    
    /**
     * 자격증 상세 보기
     */
    viewCertificate: async function(certId) {
        try {
            const certDoc = await dbService.getDocument('certificates', certId);
            
            if (!certDoc.success) {
                adminAuth.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            const cert = certDoc.data;
            
            // 연관 정보 조회
            const userDoc = await dbService.getDocument('users', cert.userId);
            const courseDoc = await dbService.getDocument('courses', cert.courseId);
            
            const user = userDoc.success ? userDoc.data : null;
            const course = courseDoc.success ? courseDoc.data : null;
            
            const modalContent = `
                <div class="space-y-4">
                    <div>
                        <h4 class="font-medium text-gray-700">자격증 번호</h4>
                        <p>${cert.certificateNumber}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">자격증 종류</h4>
                        <p>${this.getCertificateName(cert.certificateType)}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">수료자 정보</h4>
                        <p>${cert.holderName} (${user?.email || '-'})</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">교육 과정</h4>
                        <p>${course?.title || '-'}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">발급일</h4>
                            <p>${formatters.formatDate(cert.issueDate?.toDate())}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">만료일</h4>
                            <p>${formatters.formatDate(cert.expiryDate?.toDate())}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">상태</h4>
                        <p>${this.getStatusBadge(cert.status)}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">비고</h4>
                        <p class="whitespace-pre-wrap">${cert.remarks || '-'}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">발급일시</h4>
                        <p>${formatters.formatDateTime(cert.createdAt?.toDate())}</p>
                    </div>
                </div>
            `;
            
            adminUtils.showModal({
                title: '자격증 상세 정보',
                content: modalContent,
                buttons: [
                    { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                ]
            });
        } catch (error) {
            console.error('자격증 상세 조회 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 자격증 수정
     */
    editCertificate: async function(certId) {
        try {
            const certDoc = await dbService.getDocument('certificates', certId);
            
            if (!certDoc.success) {
                adminAuth.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            const cert = certDoc.data;
            
            const modalContent = `
                <form id="edit-cert-form" onsubmit="certManager.handleEditCertificate(event, '${certId}')">
                    <div class="admin-form-group">
                        <label class="admin-form-label">자격증 번호</label>
                        <input type="text" name="certificateNumber" class="admin-form-control" value="${cert.certificateNumber}" readonly>
                        <p class="text-sm text-gray-500 mt-1">자격증 번호는 변경할 수 없습니다.</p>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">수료자명</label>
                        <input type="text" name="holderName" class="admin-form-control" value="${cert.holderName}" readonly>
                        <p class="text-sm text-gray-500 mt-1">수료자명은 변경할 수 없습니다.</p>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">발급일 <span class="text-red-500">*</span></label>
                        <input type="date" name="issueDate" class="admin-form-control" 
                            value="${formatters.formatDateToInput(cert.issueDate?.toDate())}" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">만료일 <span class="text-red-500">*</span></label>
                        <input type="date" name="expiryDate" class="admin-form-control" 
                            value="${formatters.formatDateToInput(cert.expiryDate?.toDate())}" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">상태 <span class="text-red-500">*</span></label>
                        <select name="status" class="admin-form-control" required>
                            <option value="active" ${cert.status === 'active' ? 'selected' : ''}>유효</option>
                            <option value="expired" ${cert.status === 'expired' ? 'selected' : ''}>만료</option>
                            <option value="revoked" ${cert.status === 'revoked' ? 'selected' : ''}>취소</option>
                        </select>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">비고</label>
                        <textarea name="remarks" rows="3" class="admin-form-control">${cert.remarks || ''}</textarea>
                    </div>
                </form>
            `;
            
            adminUtils.showModal({
                title: '자격증 정보 수정',
                content: modalContent,
                buttons: [
                    { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                    { label: '저장', type: 'primary', handler: 'document.getElementById("edit-cert-form").submit()' }
                ]
            });
        } catch (error) {
            console.error('자격증 수정 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 자격증 수정 처리
     */
    handleEditCertificate: async function(event, certId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            const updateData = {
                issueDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(formData.get('issueDate'))),
                expiryDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(formData.get('expiryDate'))),
                status: formData.get('status'),
                remarks: formData.get('remarks') || ''
            };
            
            const result = await dbService.updateDocument('certificates', certId, updateData);
            
            if (result.success) {
                adminAuth.showNotification('자격증 정보가 수정되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadCertificates();
            } else {
                adminAuth.showNotification('자격증 정보 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('자격증 수정 처리 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 자격증 취소
     */
    revokeCertificate: function(certId) {
        adminUtils.confirmDialog(
            '정말로 이 자격증을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            () => this.handleRevokeCertificate(certId)
        );
    },
    
    /**
     * 자격증 취소 처리
     */
    handleRevokeCertificate: async function(certId) {
        adminUtils.showLoadingOverlay(true);
        
        try {
            const result = await dbService.updateDocument('certificates', certId, {
                status: 'revoked',
                revokedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
            });
            
            if (result.success) {
                adminAuth.showNotification('자격증이 취소되었습니다.', 'success');
                this.loadCertificates();
            } else {
                adminAuth.showNotification('자격증 취소에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('자격증 취소 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 자격증 PDF 다운로드
     */
    downloadPdf: async function(certId) {
        try {
            adminUtils.showLoadingOverlay(true);
            
            // 자격증 정보 조회
            const certDoc = await dbService.getDocument('certificates', certId);
            
            if (!certDoc.success) {
                adminAuth.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            const cert = certDoc.data;
            
            // PDF 생성을 위한 데이터 준비
            const pdfData = {
                certificateNumber: cert.certificateNumber,
                certificateType: this.getCertificateName(cert.certificateType),
                holderName: cert.holderName,
                issueDate: formatters.formatDate(cert.issueDate?.toDate()),
                expiryDate: formatters.formatDate(cert.expiryDate?.toDate())
            };
            
            // 실제로는 PDF 생성 라이브러리(jsPDF 등)를 사용하여 PDF를 생성하고 다운로드해야 함
            // 여기서는 예시로 alert만 표시
            adminAuth.showNotification('PDF 생성 기능은 별도 구현이 필요합니다.', 'info');
            
            // 예시: jsPDF를 사용한 PDF 생성
            // const doc = new jsPDF();
            // doc.text(`자격증 번호: ${pdfData.certificateNumber}`, 10, 10);
            // doc.save(`certificate_${cert.certificateNumber}.pdf`);
            
        } catch (error) {
            console.error('PDF 다운로드 오류:', error);
            adminAuth.showNotification('PDF 다운로드에 실패했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 검색 필터 적용
     */
    applyFilters: function() {
        this.filters = {
            searchKeyword: document.getElementById('search-keyword')?.value || '',
            certificateType: document.getElementById('certificate-type')?.value || '',
            status: document.getElementById('cert-status')?.value || '',
            startDate: document.getElementById('start-date')?.value || '',
            endDate: document.getElementById('end-date')?.value || ''
        };
        
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCertificates();
    },
    
    /**
     * 검색 필터 초기화
     */
    resetFilters: function() {
        adminUtils.resetFilters();
        this.filters = {};
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCertificates();
    },
    
    /**
     * 자격증 이름 가져오기
     */
    getCertificateName: function(type) {
        const types = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return types[type] || type;
    },
    
    /**
     * 상태 뱃지 가져오기
     */
    getStatusBadge: function(status) {
        const statusBadge = {
            'active': '<span class="admin-badge admin-badge-success">유효</span>',
            'expired': '<span class="admin-badge admin-badge-danger">만료</span>',
            'revoked': '<span class="admin-badge admin-badge-warning">취소</span>'
        };
        return statusBadge[status] || status;
    },
    
    /**
     * 자격증 만료 체크 (자동 업데이트)
     */
    checkExpiredCertificates: async function() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 만료일이 지난 자격증 조회
            const expiredCerts = await dbService.getDocuments('certificates', {
                where: [
                    { field: 'status', operator: '==', value: 'active' },
                    { field: 'expiryDate', operator: '<', value: today }
                ]
            });
            
            if (expiredCerts.success && expiredCerts.data.length > 0) {
                // 배치 업데이트
                await dbService.runBatch(async (batch) => {
                    expiredCerts.data.forEach(cert => {
                        const certRef = window.dhcFirebase.db.collection('certificates').doc(cert.id);
                        batch.update(certRef, { status: 'expired' });
                    });
                });
                
                console.log(`${expiredCerts.data.length}개의 자격증 상태가 만료로 변경되었습니다.`);
                this.loadCertificates();
            }
        } catch (error) {
            console.error('자격증 만료 체크 오류:', error);
        }
    }
};

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', async function() {
    // Firebase 초기화 대기
    await window.dhcFirebase.initialize();
    
    // 관리자 권한 확인
    const hasAccess = await window.adminAuth.checkAdminAccess();
    if (!hasAccess) {
        return; // 권한이 없으면 이미 리디렉션됨
    }
    
    // 관리자 정보 표시
    await window.adminAuth.displayAdminInfo();
    
    // 검색 필터 설정
    const filterOptions = {
        searchField: {
            label: '검색',
            placeholder: '자격증 번호 또는 수료자명으로 검색'
        },
        selectFilters: [
            {
                id: 'certificate-type',
                label: '자격증 종류',
                options: [
                    { value: 'health-exercise', label: '건강운동처방사' },
                    { value: 'rehabilitation', label: '운동재활전문가' },
                    { value: 'pilates', label: '필라테스 전문가' },
                    { value: 'recreation', label: '레크리에이션지도자' }
                ]
            },
            {
                id: 'cert-status',
                label: '상태',
                options: [
                    { value: 'active', label: '유효' },
                    { value: 'expired', label: '만료' },
                    { value: 'revoked', label: '취소' }
                ]
            }
        ],
        dateFilter: true
    };
    
    adminUtils.createSearchFilter('cert-filter-container', filterOptions, 'certManager.applyFilters');
    
    // 자격증 목록 로드
    certManager.loadCertificates();
    
    // 자격증 만료 체크
    certManager.checkExpiredCertificates();
});