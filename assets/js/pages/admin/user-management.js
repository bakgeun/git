/**
 * 회원 관리 페이지 스크립트
 */

// 회원 관리 객체
const userManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    
    /**
     * 초기화 함수
     */
    init: async function() {
        try {
            console.log('회원 관리자 초기화 시작');
            
            // 관리자 정보 표시
            await window.adminAuth.displayAdminInfo();
            
            // 검색 필터 설정
            const filterOptions = {
                searchField: {
                    label: '검색',
                    placeholder: '이름 또는 이메일로 검색'
                },
                selectFilters: [
                    {
                        id: 'user-type',
                        label: '회원유형',
                        options: [
                            { value: 'student', label: '수강생' },
                            { value: 'instructor', label: '강사' },
                            { value: 'admin', label: '관리자' }
                        ]
                    }
                ]
            };
            
            adminUtils.createSearchFilter('user-filter-container', filterOptions, 'userManager.applyFilters');
            
            // 회원 목록 로드
            await this.loadUsers();
            
            console.log('회원 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('회원 관리자 초기화 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
            }
            return false;
        }
    },
    
    /**
     * 회원 목록 로드
     */
    loadUsers: async function() {
        adminUtils.showLoadingOverlay(true);
        
        try {
            // 필터 옵션 설정
            const options = {
                orderBy: { field: 'createdAt', direction: 'desc' },
                pageSize: this.pageSize
            };
            
            // 필터 적용
            if (this.filters.userType) {
                options.where = options.where || [];
                options.where.push({ field: 'userType', operator: '==', value: this.filters.userType });
            }
            
            // 검색어 필터 (이름 또는 이메일)
            let searchResults;
            if (this.filters.searchKeyword) {
                // 이름으로 검색
                const nameResults = await dbService.searchDocuments('users', 'displayName', this.filters.searchKeyword, options);
                // 이메일로 검색
                const emailResults = await dbService.searchDocuments('users', 'email', this.filters.searchKeyword, options);
                
                // 결과 병합 및 중복 제거
                const allResults = [...(nameResults.data || []), ...(emailResults.data || [])];
                const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
                searchResults = { success: true, data: uniqueResults };
            } else {
                // 일반 조회
                searchResults = await dbService.getPaginatedDocuments('users', options, this.currentPage > 1 ? this.lastDoc : null);
            }
            
            if (searchResults.success) {
                // 테이블 업데이트
                this.updateUserTable(searchResults.data);
                
                // 페이지네이션 업데이트
                if (!this.filters.searchKeyword) {
                    this.lastDoc = searchResults.lastDoc;
                    
                    // 전체 회원 수 계산 (페이지네이션을 위해)
                    const totalCount = await dbService.countDocuments('users', { where: options.where });
                    const totalPages = Math.ceil(totalCount.count / this.pageSize);
                    
                    adminUtils.createPagination('user-pagination', this.currentPage, totalPages, 'userManager.changePage');
                }
            } else {
                console.error('회원 목록 로드 실패:', searchResults.error);
                adminAuth.showNotification('회원 목록을 불러오는데 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('회원 목록 로드 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 회원 테이블 업데이트
     */
    updateUserTable: function(users) {
        const columns = {
            displayName: { 
                label: '이름',
                formatter: (value, user) => value || user.email.split('@')[0]
            },
            email: { label: '이메일' },
            userType: { 
                label: '회원유형',
                formatter: (value) => {
                    const types = {
                        'admin': '관리자',
                        'student': '수강생',
                        'instructor': '강사'
                    };
                    return types[value] || value;
                }
            },
            createdAt: { 
                label: '가입일',
                formatter: (value) => value ? formatters.formatDate(value.toDate()) : '-'
            },
            status: { 
                label: '상태',
                formatter: (value) => {
                    const status = value || 'active';
                    const statusBadge = {
                        'active': '<span class="admin-badge admin-badge-success">활성</span>',
                        'inactive': '<span class="admin-badge admin-badge-danger">비활성</span>',
                        'suspended': '<span class="admin-badge admin-badge-warning">정지</span>'
                    };
                    return statusBadge[status] || status;
                }
            }
        };
        
        const actions = [
            { label: '수정', type: 'primary', handler: 'userManager.editUser' },
            { label: '삭제', type: 'danger', handler: 'userManager.deleteUser' }
        ];
        
        adminUtils.createDataTable('user-table', users, columns, { actions });
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadUsers();
    },
    
    /**
     * 회원 추가 모달 표시
     */
    showAddUserModal: function() {
        const modalContent = `
            <form id="user-form" onsubmit="userManager.handleAddUser(event)">
                <div class="admin-form-group">
                    <label class="admin-form-label">이메일 <span class="text-red-500">*</span></label>
                    <input type="email" name="email" class="admin-form-control" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">비밀번호 <span class="text-red-500">*</span></label>
                    <input type="password" name="password" class="admin-form-control" minlength="6" required>
                    <p class="text-sm text-gray-500 mt-1">최소 6자 이상</p>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">이름 <span class="text-red-500">*</span></label>
                    <input type="text" name="displayName" class="admin-form-control" required>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">회원유형 <span class="text-red-500">*</span></label>
                    <select name="userType" class="admin-form-control" required>
                        <option value="student">수강생</option>
                        <option value="instructor">강사</option>
                        <option value="admin">관리자</option>
                    </select>
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">전화번호</label>
                    <input type="tel" name="phoneNumber" class="admin-form-control" 
                        placeholder="010-1234-5678">
                </div>
                
                <div class="admin-form-group">
                    <label class="admin-form-label">주소</label>
                    <input type="text" name="address" class="admin-form-control">
                </div>
            </form>
        `;
        
        adminUtils.showModal({
            title: '회원 추가',
            content: modalContent,
            buttons: [
                { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                { label: '추가', type: 'primary', handler: 'document.getElementById("user-form").submit()' }
            ]
        });
    },
    
    /**
     * 회원 추가 처리
     */
    handleAddUser: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // 유효성 검사
        const rules = {
            email: { required: '이메일을 입력해주세요.' },
            password: { 
                required: '비밀번호를 입력해주세요.',
                minLength: { value: 6, message: '비밀번호는 최소 6자 이상이어야 합니다.' }
            },
            displayName: { required: '이름을 입력해주세요.' },
            userType: { required: '회원유형을 선택해주세요.' }
        };
        
        if (!adminUtils.validateForm(form, rules)) {
            return;
        }
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            // 회원 데이터 준비
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                displayName: formData.get('displayName'),
                userType: formData.get('userType'),
                phoneNumber: formData.get('phoneNumber') || '',
                address: formData.get('address') || '',
                status: 'active'
            };
            
            // Firebase Auth로 사용자 생성
            const result = await authService.signUp(userData.email, userData.password, userData);
            
            if (result.success) {
                adminAuth.showNotification('회원이 추가되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadUsers();
            } else {
                adminAuth.showNotification('회원 추가에 실패했습니다: ' + (result.error.message || '알 수 없는 오류'), 'error');
            }
        } catch (error) {
            console.error('회원 추가 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 회원 수정
     */
    editUser: async function(userId) {
        try {
            // 회원 정보 로드
            const userDoc = await dbService.getDocument('users', userId);
            
            if (!userDoc.success) {
                adminAuth.showNotification('회원 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            const user = userDoc.data;
            
            const modalContent = `
                <form id="edit-user-form" onsubmit="userManager.handleEditUser(event, '${userId}')">
                    <div class="admin-form-group">
                        <label class="admin-form-label">이메일</label>
                        <input type="email" name="email" class="admin-form-control" value="${user.email}" readonly>
                        <p class="text-sm text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">이름 <span class="text-red-500">*</span></label>
                        <input type="text" name="displayName" class="admin-form-control" value="${user.displayName || ''}" required>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">회원유형 <span class="text-red-500">*</span></label>
                        <select name="userType" class="admin-form-control" required>
                            <option value="student" ${user.userType === 'student' ? 'selected' : ''}>수강생</option>
                            <option value="instructor" ${user.userType === 'instructor' ? 'selected' : ''}>강사</option>
                            <option value="admin" ${user.userType === 'admin' ? 'selected' : ''}>관리자</option>
                        </select>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">상태</label>
                        <select name="status" class="admin-form-control">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>활성</option>
                            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>비활성</option>
                            <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>정지</option>
                        </select>
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">전화번호</label>
                        <input type="tel" name="phoneNumber" class="admin-form-control" 
                            value="${user.phoneNumber || ''}" placeholder="010-1234-5678">
                    </div>
                    
                    <div class="admin-form-group">
                        <label class="admin-form-label">주소</label>
                        <input type="text" name="address" class="admin-form-control" value="${user.address || ''}">
                    </div>
                </form>
            `;
            
            adminUtils.showModal({
                title: '회원 정보 수정',
                content: modalContent,
                buttons: [
                    { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                    { label: '저장', type: 'primary', handler: 'document.getElementById("edit-user-form").submit()' }
                ]
            });
        } catch (error) {
            console.error('회원 수정 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 회원 수정 처리
     */
    handleEditUser: async function(event, userId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        adminUtils.showLoadingOverlay(true);
        
        try {
            const updateData = {
                displayName: formData.get('displayName'),
                userType: formData.get('userType'),
                status: formData.get('status'),
                phoneNumber: formData.get('phoneNumber') || '',
                address: formData.get('address') || ''
            };
            
            const result = await dbService.updateDocument('users', userId, updateData);
            
            if (result.success) {
                adminAuth.showNotification('회원 정보가 수정되었습니다.', 'success');
                adminUtils.closeModal();
                this.loadUsers();
            } else {
                adminAuth.showNotification('회원 정보 수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('회원 수정 처리 오류:', error);
            adminAuth.showNotification('오류가 발생했습니다.', 'error');
        } finally {
            adminUtils.showLoadingOverlay(false);
        }
    },
    
    /**
     * 회원 삭제
     */
    deleteUser: function(userId) {
        adminUtils.confirmDialog(
            '정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            () => this.handleDeleteUser(userId)
        );
    },
    
    /**
     * 회원 삭제 처리
     */
    handleDeleteUser: async function(userId) {
        adminUtils.showLoadingOverlay(true);
        
        try {
            const result = await dbService.deleteDocument('users', userId);
            
            if (result.success) {
                adminAuth.showNotification('회원이 삭제되었습니다.', 'success');
                this.loadUsers();
            } else {
                adminAuth.showNotification('회원 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('회원 삭제 오류:', error);
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
            userType: document.getElementById('user-type')?.value || ''
        };
        
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadUsers();
    },
    
    /**
     * 검색 필터 초기화
     */
    resetFilters: function() {
        adminUtils.resetFilters();
        this.filters = {};
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadUsers();
    }
};

/**
 * 회원 관리 페이지 초기화 함수
 */
async function initUserManagement() {
    try {
        console.log('회원 관리 페이지 초기화 시작');
        await userManager.init();
        console.log('회원 관리 페이지 초기화 완료');
    } catch (error) {
        console.error('회원 관리 페이지 초기화 오류:', error);
    }
}

// 레거시 방식 지원 (DOMContentLoaded 이벤트 리스너)
// 새로운 스크립트 로더를 사용하지 않는 환경을 위해 유지
document.addEventListener('DOMContentLoaded', async function() {
    // 스크립트 로더를 통해 초기화되지 않았을 경우에만 실행
    if (!window.scriptLoaderInitialized) {
        // Firebase 초기화 대기
        if (window.dhcFirebase && typeof window.dhcFirebase.initialize === 'function') {
            await window.dhcFirebase.initialize();
        }
        
        // 관리자 권한 확인
        if (window.adminAuth && typeof window.adminAuth.checkAdminAccess === 'function') {
            const hasAccess = await window.adminAuth.checkAdminAccess();
            if (!hasAccess) {
                return; // 권한이 없으면 이미 리디렉션됨
            }
            
            // 페이지 초기화
            await initUserManagement();
        }
    }
});