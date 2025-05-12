/**
 * 교육 관리 페이지 스크립트
 */

// 교육 관리 객체
const courseManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    
    /**
     * 교육 과정 목록 로드
     */
    loadCourses: async function() {
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
            
            // 검색어 필터
            let searchResults;
            if (this.filters.searchKeyword) {
                searchResults = await dbService.searchDocuments('courses', 'title', this.filters.searchKeyword, options);
            } else {
                searchResults = await dbService.getPaginatedDocuments('courses', options, this.currentPage > 1 ? this.lastDoc : null);
            }
            
            if (searchResults.success) {
                // 테이블 업데이트
                this.updateCourseTable(searchResults.data);
                
                // 페이지네이션 업데이트
                if (!this.filters.searchKeyword) {
                    this.lastDoc = searchResults.lastDoc;
                    
                    // 전체 과정 수 계산
                    const totalCount = await dbService.countDocuments('courses', { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);
                    
                    adminUtils.createPagination('course-pagination', this.currentPage, totalPages, 'courseManager.changePage');
                }
            } else {
                console.error('교육 과정 목록 로드 실패:', searchResults.error);
                adminAuth.showNotification('교육 과정 목록을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('교육 과정 목록 로드 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 교육 과정 테이블 업데이트
     */
    updateCourseTable: function(courses) {
        const columns = {
            title: { label: '교육명' },
            certificateType: { 
                label: '자격증',
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
            period: { 
                label: '기간',
                formatter: (value, course) => {
                    const startDate = course.startDate ? formatters.formatDate(course.startDate.toDate()) : '-';
                    const endDate = course.endDate ? formatters.formatDate(course.endDate.toDate()) : '-';
                    return `${startDate} ~ ${endDate}`;
                }
            },
            price: { 
                label: '수강료',
                formatter: (value) => formatters.formatCurrency(value)
            },
            capacity: { 
                label: '정원',
                formatter: (value, course) => {
                    const enrolled = course.enrolledCount || 0;
                    return `${enrolled}/${value}명`;
                }
            },
            status: { 
                label: '상태',
                formatter: (value) => {
                    const statusBadge = {
                        'active': '<span class="admin-badge admin-badge-success">모집중</span>',
                        'closed': '<span class="admin-badge admin-badge-danger">마감</span>',
                        'completed': '<span class="admin-badge admin-badge-info">종료</span>',
                        'preparing': '<span class="admin-badge admin-badge-warning">준비중</span>'
                    };
                    return statusBadge[value] || value;
                }
            }
        };
        
        const actions = [
            { label: '상세', type: 'info', handler: 'courseManager.viewCourse' },
            { label: '수정', type: 'primary', handler: 'courseManager.editCourse' },
            { label: '삭제', type: 'danger', handler: 'courseManager.deleteCourse' }
        ];
        
        adminUtils.createDataTable('course-table', courses, columns, { actions });
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadCourses();
    },
    
    /**
     * 교육 과정 추가 모달 표시
     */
    showAddCourseModal: function() {
        const modalContent = `
            <form id="course-form" onsubmit="courseManager.handleAddCourse(event)">
                <div class="admin-form-group">
                    <label class="admin-form-label">교육명 <span class="text-red-500">*</span></label>
                    <input type="text" name="title" class="admin-form-control" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">자격증 종류 <span class="text-red-500">*</span></label>
                    <select name="certificateType" class="admin-form-control" required>
                        <option value="">선택하세요</option>
                        <option value="health-exercise">건강운동처방사</option>
                        <option value="rehabilitation">운동재활전문가</option>
                        <option value="pilates">필라테스 전문가</option>
                        <option value="recreation">레크리에이션지도자</option>
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="admin-form-group">
                        <label class="admin-form-label">시작일 <span class="text-red-500">*</span></label>
                        <input type="date" name="startDate" class="admin-form-control" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">종료일 <span class="text-red-500">*</span></label>
                        <input type="date" name="endDate" class="admin-form-control" required>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="admin-form-group">
                        <label class="admin-form-label">수강료 <span class="text-red-500">*</span></label>
                        <input type="number" name="price" class="admin-form-control" min="0" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">정원 <span class="text-red-500">*</span></label>
                        <input type="number" name="capacity" class="admin-form-control" min="1" required>
                    </div>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">강사 <span class="text-red-500">*</span></label>
                    <input type="text" name="instructor" class="admin-form-control" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">교육 장소</label>
                    <input type="text" name="location" class="admin-form-control">
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">상태 <span class="text-red-500">*</span></label>
                    <select name="status" class="admin-form-control" required>
                        <option value="preparing">준비중</option>
                        <option value="active">모집중</option>
                        <option value="closed">마감</option>
                        <option value="completed">종료</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">교육 내용</label>
                    <textarea name="description" rows="4" class="admin-form-control"></textarea>
                </div>
            </form>
        `;
        
        adminUtils.showModal({
            title: '교육 과정 추가',
            content: modalContent,
            buttons: [
                { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                { label: '추가', type: 'primary', handler: 'document.getElementById("course-form").submit()' }
            ]
        });
    },
    
    /**
     * 교육 과정 추가 처리
     */
    handleAddCourse: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // 유효성 검사
        const startDate = new Date(formData.get('startDate'));
        const endDate = new Date(formData.get('endDate'));
        
        if (endDate <= startDate) {
            adminAuth.showNotification('종료일은 시작일보다 이후여야 합니다.', 'error');
            return;
        }
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            const courseData = {
                title: formData.get('title'),
                certificateType: formData.get('certificateType'),
                startDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(startDate),
                endDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(endDate),
                price: parseInt(formData.get('price')),
                capacity: parseInt(formData.get('capacity')),
                instructor: formData.get('instructor'),
                location: formData.get('location') || '',
                status: formData.get('status'),
                description: formData.get('description') || '',
                enrolledCount: 0
            };
            
            const result = await dbService.addDocument('courses', courseData);
            
            if (result.success) {
                adminAuth.showNotification('교육 과정이 추가되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadCourses();
            } else {
                adminAuth.showNotification('교육 과정 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('교육 과정 추가 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 교육 과정 상세 보기
     */
    viewCourse: async function(courseId) {
        try {
            const courseDoc = await dbService.getDocument('courses', courseId);
            
            if (!courseDoc.success) {
                adminAuth.showNotification('교육 과정을 불러올 수 없습니다.', 'error');
                return;
            }
            
            const course = courseDoc.data;
            
            // 수강생 목록 조회
            const enrollments = await dbService.getDocuments('enrollments', {
                where: { field: 'courseId', operator: '==', value: courseId }
            });
            
            let enrollmentListHtml = '<p class="text-gray-500">수강생이 없습니다.</p>';
            
            if (enrollments.success && enrollments.data.length > 0) {
                // 수강생 정보 로드
                const userPromises = enrollments.data.map(enrollment => 
                    dbService.getDocument('users', enrollment.userId)
                );
                const users = await Promise.all(userPromises);
                
                enrollmentListHtml = `
                    <table class="w-full mt-4">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left pb-2">이름</th>
                                <th class="text-left pb-2">이메일</th>
                                <th class="text-left pb-2">신청일</th>
                                <th class="text-left pb-2">상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${enrollments.data.map((enrollment, index) => {
                                const user = users[index].success ? users[index].data : null;
                                return `
                                    <tr class="border-b">
                                        <td class="py-2">${user?.displayName || '알 수 없음'}</td>
                                        <td class="py-2">${user?.email || '알 수 없음'}</td>
                                        <td class="py-2">${formatters.formatDate(enrollment.createdAt?.toDate())}</td>
                                        <td class="py-2">
                                            <span class="admin-badge admin-badge-${enrollment.status === 'completed' ? 'success' : 'info'}">
                                                ${enrollment.status === 'completed' ? '수료' : '수강중'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
            }
            
            const modalContent = `
                <div class="space-y-4">
                    <div>
                        <h4 class="font-medium text-gray-700">교육명</h4>
                        <p>${course.title}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">자격증</h4>
                            <p>${this.getCertificateName(course.certificateType)}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">강사</h4>
                            <p>${course.instructor}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">기간</h4>
                            <p>${formatters.formatDate(course.startDate?.toDate())} ~ ${formatters.formatDate(course.endDate?.toDate())}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">수강료</h4>
                            <p>${formatters.formatCurrency(course.price)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">정원</h4>
                            <p>${course.enrolledCount || 0}/${course.capacity}명</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">상태</h4>
                            <p>${this.getStatusBadge(course.status)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">교육 장소</h4>
                        <p>${course.location || '-'}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">교육 내용</h4>
                        <p>${course.description || '-'}</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700 mb-2">수강생 목록</h4>
                        ${enrollmentListHtml}
                    </div>
                </div>
            `;
            
            adminUtils.showModal({
                title: '교육 과정 상세',
                content: modalContent,
                buttons: [
                    { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                ]
            });
        } catch (error) {
            console.error('교육 과정 상세 보기 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 교육 과정 수정
     */
    editCourse: async function(courseId) {
        try {
            const courseDoc = await dbService.getDocument('courses', courseId);
            
            if (!courseDoc.success) {
                adminAuth.showNotification('교육 과정을 불러올 수 없습니다.', 'error');
                return;
            }
            
            const course = courseDoc.data;
            
            const modalContent = `
                <form id="edit-course-form" onsubmit="courseManager.handleEditCourse(event, '${courseId}')">
                    <div class="admin-form-group">
                        <label class="admin-form-label">교육명 <span class="text-red-500">*</span></label>
                        <input type="text" name="title" class="admin-form-control" value="${course.title}" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">자격증 종류 <span class="text-red-500">*</span></label>
                        <select name="certificateType" class="admin-form-control" required>
                            <option value="health-exercise" ${course.certificateType === 'health-exercise' ? 'selected' : ''}>건강운동처방사</option>
                            <option value="rehabilitation" ${course.certificateType === 'rehabilitation' ? 'selected' : ''}>운동재활전문가</option>
                            <option value="pilates" ${course.certificateType === 'pilates' ? 'selected' : ''}>필라테스 전문가</option>
                            <option value="recreation" ${course.certificateType === 'recreation' ? 'selected' : ''}>레크리에이션지도자</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="admin-form-group">
                            <label class="admin-form-label">시작일 <span class="text-red-500">*</span></label>
                            <input type="date" name="startDate" class="admin-form-control" 
                                value="${course.startDate ? formatters.formatDateForInput(course.startDate.toDate()) : ''}" required>
                        </div>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label">종료일 <span class="text-red-500">*</span></label>
                            <input type="date" name="endDate" class="admin-form-control" 
                                value="${course.endDate ? formatters.formatDateForInput(course.endDate.toDate()) : ''}" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="admin-form-group">
                            <label class="admin-form-label">수강료 <span class="text-red-500">*</span></label>
                            <input type="number" name="price" class="admin-form-control" value="${course.price}" min="0" required>
                        </div>
                        
                        <div class="admin-form-group">
                            <label class="admin-form-label">정원 <span class="text-red-500">*</span></label>
                            <input type="number" name="capacity" class="admin-form-control" value="${course.capacity}" min="1" required>
                        </div>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">강사 <span class="text-red-500">*</span></label>
                        <input type="text" name="instructor" class="admin-form-control" value="${course.instructor}" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">교육 장소</label>
                        <input type="text" name="location" class="admin-form-control" value="${course.location || ''}">
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">상태 <span class="text-red-500">*</span></label>
                        <select name="status" class="admin-form-control" required>
                            <option value="preparing" ${course.status === 'preparing' ? 'selected' : ''}>준비중</option>
                            <option value="active" ${course.status === 'active' ? 'selected' : ''}>모집중</option>
                            <option value="closed" ${course.status === 'closed' ? 'selected' : ''}>마감</option>
                            <option value="completed" ${course.status === 'completed' ? 'selected' : ''}>종료</option>
                        </select>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">교육 내용</label>
                        <textarea name="description" rows="4" class="admin-form-control">${course.description || ''}</textarea>
                    </div>
                </form>
            `;
            
            adminUtils.showModal({
                title: '교육 과정 수정',
                content: modalContent,
                buttons: [
                    { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                    { label: '저장', type: 'primary', handler: 'document.getElementById("edit-course-form").submit()' }
                ]
            });
        } catch (error) {
            console.error('교육 과정 수정 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 교육 과정 수정 처리
     */
    handleEditCourse: async function(event, courseId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // 유효성 검사
        const startDate = new Date(formData.get('startDate'));
        const endDate = new Date(formData.get('endDate'));
        
        if (endDate <= startDate) {
            adminAuth.showNotification('종료일은 시작일보다 이후여야 합니다.', 'error');
            return;
        }
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            const updateData = {
                title: formData.get('title'),
                certificateType: formData.get('certificateType'),
                startDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(startDate),
                endDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(endDate),
                price: parseInt(formData.get('price')),
                capacity: parseInt(formData.get('capacity')),
                instructor: formData.get('instructor'),
                location: formData.get('location') || '',
                status: formData.get('status'),
                description: formData.get('description') || ''
            };
            
            const result = await dbService.updateDocument('courses', courseId, updateData);
            
            if (result.success) {
                adminAuth.showNotification('교육 과정이 수정되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadCourses();
            } else {
                adminAuth.showNotification('교육 과정 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('교육 과정 수정 처리 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 교육 과정 삭제
     */
    deleteCourse: function(courseId) {
        adminUtils.confirmDialog(
            '정말로 이 교육 과정을 삭제하시겠습니까? 수강생 정보도 함께 삭제됩니다.',
            () => this.handleDeleteCourse(courseId)
        );
    },
    
    /**
     * 교육 과정 삭제 처리
     */
    handleDeleteCourse: async function(courseId) {
        adminUtils.showLoadingOverlay(true);
        
        try {
            // 관련 수강생 정보 삭제
            const enrollments = await dbService.getDocuments('enrollments', {
                where: { field: 'courseId', operator: '==', value: courseId }
            });
            
            if (enrollments.success && enrollments.data.length > 0) {
                // 배치 삭제
                await dbService.runBatch(batch => {
                    enrollments.data.forEach(enrollment => {
                        const enrollmentRef = window.dhcFirebase.db.collection('enrollments').doc(enrollment.id);
                        batch.delete(enrollmentRef);
                    });
                });
            }
            
            // 교육 과정 삭제
            const result = await dbService.deleteDocument('courses', courseId);
            
            if (result.success) {
                adminAuth.showNotification('교육 과정이 삭제되었습니다.', 'success');
                this.loadCourses();
            } else {
                adminAuth.showNotification('교육 과정 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('교육 과정 삭제 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
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
            status: document.getElementById('course-status')?.value || ''
        };
        
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCourses();
    },
    
    /**
     * 검색 필터 초기화
     */
    resetFilters: function() {
        adminUtils.resetFilters();
        this.filters = {};
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCourses();
    },
    
    /**
     * 자격증 이름 반환
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
     * 상태 뱃지 반환
     */
    getStatusBadge: function(status) {
        const statusBadge = {
            'active': '<span class="admin-badge admin-badge-success">모집중</span>',
            'closed': '<span class="admin-badge admin-badge-danger">마감</span>',
            'completed': '<span class="admin-badge admin-badge-info">종료</span>',
            'preparing': '<span class="admin-badge admin-badge-warning">준비중</span>'
        };
        return statusBadge[status] || status;
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
            placeholder: '교육명으로 검색'
        },
        selectFilters: [
            {
                id: 'certificate-type',
                label: '자격증',
                options: [
                    { value: 'health-exercise', label: '건강운동처방사' },
                    { value: 'rehabilitation', label: '운동재활전문가' },
                    { value: 'pilates', label: '필라테스 전문가' },
                    { value: 'recreation', label: '레크리에이션지도자' }
                ]
            },
            {
                id: 'course-status',
                label: '상태',
                options: [
                    { value: 'preparing', label: '준비중' },
                    { value: 'active', label: '모집중' },
                    { value: 'closed', label: '마감' },
                    { value: 'completed', label: '종료' }
                ]
            }
        ]
    };
    
    adminUtils.createSearchFilter('course-filter-container', filterOptions, 'courseManager.applyFilters');
    
    // 교육 과정 목록 로드
    courseManager.loadCourses();
});