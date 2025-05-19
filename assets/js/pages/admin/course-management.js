/**
 * 교육 관리 페이지 스크립트
 */

// 교육 관리 객체
window.courseManager = {
    currentCourseType: 'health-exercise',
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,

    /**
     * 초기화 함수
     */
    init: async function () {
        try {
            console.log('교육 관리자 초기화 시작');

            // 교육 관리 탭 이벤트 리스너 설정
            document.querySelectorAll('.course-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const courseType = tab.getAttribute('data-course');
                    this.switchCourseType(courseType);
                });
            });

            // 폼 제출 이벤트 리스너 설정
            const courseForm = document.getElementById('course-form');
            if (courseForm) {
                courseForm.addEventListener('submit', this.handleAddCourse.bind(this));
            }

            // 검색 필터 이벤트 리스너
            const searchInput = document.getElementById('search-course-name');
            const statusFilter = document.getElementById('filter-status');
            const instructorFilter = document.getElementById('filter-instructor');

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.search();
                    }
                });
            }

            // 교육 과정 목록 로드
            await this.loadCourses();

            console.log('교육 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('교육 관리자 초기화 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
            }
            return false;
        }
    },

    /**
     * 교육 과정 목록 로드
     */
    loadCourses: async function () {
        try {
            // 로딩 표시
            document.querySelector('#course-table tbody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-gray-500">데이터 로딩 중...</td>
            </tr>
        `;

            // 필터 옵션 설정 - 인덱스 오류 방지를 위해 단순화된 쿼리 사용
            const options = {
                where: [
                    { field: 'certificateType', operator: '==', value: this.currentCourseType }
                ]
                // orderBy는 인덱스 오류를 방지하기 위해 제거함
                // orderBy: [{ field: 'createdAt', direction: 'desc' }]
            };

            // 검색어 필터
            const searchKeyword = document.getElementById('search-course-name')?.value;
            if (searchKeyword) {
                options.where.push({ field: 'title', operator: '>=', value: searchKeyword });
                options.where.push({ field: 'title', operator: '<=', value: searchKeyword + '\uf8ff' });
            }

            // 상태 필터
            const statusFilter = document.getElementById('filter-status')?.value;
            if (statusFilter) {
                options.where.push({ field: 'status', operator: '==', value: statusFilter });
            }

            // 강사 필터
            const instructorFilter = document.getElementById('filter-instructor')?.value;
            if (instructorFilter) {
                options.where.push({ field: 'instructor', operator: '==', value: instructorFilter });
            }

            // 데이터 가져오기
            let courses = [];

            // 실제 Firebase 연동 시 사용할 코드
            if (window.dhcFirebase && window.dhcFirebase.db) {
                let query = window.dhcFirebase.db.collection('courses');

                // where 조건 적용 - certificateType만 필터링
                query = query.where('certificateType', '==', this.currentCourseType);

                // 상태 필터가 있는 경우에만 추가
                if (statusFilter) {
                    query = query.where('status', '==', statusFilter);
                }

                // 검색 키워드가 있으면 다른 접근법 사용 (인덱스 문제 방지)
                if (searchKeyword || instructorFilter) {
                    // 우선 모든 데이터 가져오고 클라이언트에서 필터링
                    const snapshot = await query.get();

                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            // 클라이언트 필터링
                            let include = true;

                            if (searchKeyword && !data.title.includes(searchKeyword)) {
                                include = false;
                            }

                            if (instructorFilter && data.instructor !== instructorFilter) {
                                include = false;
                            }

                            if (include) {
                                courses.push({
                                    id: doc.id,
                                    ...data
                                });
                            }
                        });
                    }

                    // 클라이언트 측에서 정렬 (최신 생성일 기준)
                    courses.sort((a, b) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                    });

                    // 페이지네이션 처리 (클라이언트 측)
                    const startIndex = (this.currentPage - 1) * this.pageSize;
                    courses = courses.slice(startIndex, startIndex + this.pageSize);
                } else {
                    // 필터가 없는 경우는 단순 쿼리 실행
                    // 정렬은 클라이언트에서 나중에 처리
                    const snapshot = await query.get();

                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            courses.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });

                        // 클라이언트 측에서 정렬 (최신 생성일 기준)
                        courses.sort((a, b) => {
                            const dateA = a.createdAt?.seconds || 0;
                            const dateB = b.createdAt?.seconds || 0;
                            return dateB - dateA;
                        });
                    }
                }
            } else {
                // 테스트용 더미 데이터
                courses = [
                    {
                        id: '1',
                        title: '건강운동처방사 기본과정',
                        certificateType: 'health-exercise',
                        instructor: '김운동',
                        startDate: new Date('2025-05-01'),
                        endDate: new Date('2025-06-30'),
                        price: 350000,
                        capacity: 30,
                        enrolledCount: 15,
                        status: 'active'
                    },
                    {
                        id: '2',
                        title: '건강운동처방사 심화과정',
                        certificateType: 'health-exercise',
                        instructor: '이헬스',
                        startDate: new Date('2025-07-01'),
                        endDate: new Date('2025-08-31'),
                        price: 450000,
                        capacity: 20,
                        enrolledCount: 5,
                        status: 'preparing'
                    }
                ];
            }

            // 테이블 업데이트
            this.updateCourseTable(courses);

        } catch (error) {
            console.error('교육 과정 목록 로드 오류:', error);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('교육 과정 목록을 불러오는데 실패했습니다.', 'error');
            }

            // 오류 메시지 표시
            document.querySelector('#course-table tbody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-red-500">
                    데이터를 불러오는 중 오류가 발생했습니다.
                </td>
            </tr>
        `;
        }
    },

    /**
     * 교육 과정 테이블 업데이트
     */
    updateCourseTable: function (courses) {
        const tbody = document.querySelector('#course-table tbody');

        if (!courses || courses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">
                        데이터가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';

        courses.forEach(course => {
            const startDate = course.startDate instanceof Date ? course.startDate : new Date(course.startDate?.seconds * 1000 || 0);
            const endDate = course.endDate instanceof Date ? course.endDate : new Date(course.endDate?.seconds * 1000 || 0);

            const formatDate = (date) => {
                return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
            };

            const formatCurrency = (value) => {
                return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value).replace('₩', '') + '원';
            };

            const getStatusBadge = (status) => {
                const badges = {
                    'active': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">모집중</span>',
                    'closed': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">마감</span>',
                    'completed': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">종료</span>',
                    'preparing': '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">준비중</span>'
                };
                return badges[status] || status;
            };

            html += `
                <tr>
                    <td>${course.title}</td>
                    <td>${course.instructor}</td>
                    <td>${formatDate(startDate)} ~ ${formatDate(endDate)}</td>
                    <td>${formatCurrency(course.price)}</td>
                    <td>${course.enrolledCount || 0}/${course.capacity}명</td>
                    <td>${getStatusBadge(course.status)}</td>
                    <td>
                        <div class="flex space-x-2">
                            <button onclick="courseManager.viewCourse('${course.id}')" class="text-blue-600 hover:text-blue-800">
                                상세
                            </button>
                            <button onclick="courseManager.editCourse('${course.id}')" class="text-indigo-600 hover:text-indigo-800">
                                수정
                            </button>
                            <button onclick="courseManager.deleteCourse('${course.id}')" class="text-red-600 hover:text-red-800">
                                삭제
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    /**
     * 검색 기능
     */
    search: function () {
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCourses();
    },

    /**
     * 교육 과정 추가 모달 표시
     */
    showAddCourseModal: function () {
        const modal = document.getElementById('course-modal');
        if (modal) {
            // 폼 초기화
            const form = document.getElementById('course-form');
            if (form) {
                form.reset();
                form.removeAttribute('data-course-id'); // 추가 모드임을 보장
            }

            // 모달 제목 설정
            const modalTitle = document.getElementById('course-modal-title');
            if (modalTitle) {
                modalTitle.textContent = '교육 과정 추가';
            }

            // 모달 표시
            modal.classList.remove('hidden');
        }
    },

    /**
     * 교육 과정 모달 닫기
     */
    closeCourseModal: function () {
        const modal = document.getElementById('course-modal');
        if (modal) {
            modal.classList.add('hidden');

            // 폼 리셋 및 데이터 속성 제거
            const form = document.getElementById('course-form');
            if (form) {
                form.reset();
                form.removeAttribute('data-course-id');
            }

            // 모달 제목 초기화
            const modalTitle = document.getElementById('course-modal-title');
            if (modalTitle) {
                modalTitle.textContent = '교육 과정 추가';
            }
        }
    },

    /**
     * 교육 과정 추가 처리
     */
    handleAddCourse: async function (event) {
        event.preventDefault();

        try {
            const form = event.target;

            // 폼 데이터 수집
            const name = form.querySelector('#course-name').value;
            const certificateType = form.querySelector('#course-type').value;
            const description = form.querySelector('#course-description').value;
            const price = parseInt(form.querySelector('#course-price').value);
            const capacity = parseInt(form.querySelector('#course-capacity').value);
            const duration = parseInt(form.querySelector('#course-duration').value);
            const startDate = new Date(form.querySelector('#course-start-date').value);
            const endDate = new Date(form.querySelector('#course-end-date').value);
            const instructor = form.querySelector('#course-instructor').value;

            // 상태 필드가 있으면 가져옴
            const statusField = form.querySelector('#course-status');
            const status = statusField ? statusField.value : 'preparing';

            // 유효성 검사
            if (!name || !certificateType || !price || !capacity || !startDate || !endDate || !instructor) {
                window.adminAuth?.showNotification('모든 필수 항목을 입력하세요.', 'error');
                return;
            }

            if (endDate <= startDate) {
                window.adminAuth?.showNotification('종료일은 시작일보다 이후여야 합니다.', 'error');
                return;
            }

            // 과정 데이터 생성
            const courseData = {
                title: name,
                certificateType: certificateType,
                description: description,
                price: price,
                capacity: capacity,
                duration: duration,
                instructor: instructor,
                status: status
            };

            // Firebase 연동 시 
            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 타임스탬프로 변환
                courseData.startDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(startDate);
                courseData.endDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(endDate);

                // 수정 모드인지 확인 (폼에 data-course-id 속성이 있으면 수정 모드)
                const courseId = form.getAttribute('data-course-id');

                if (courseId) {
                    // 수정 모드
                    console.log('교육 과정 수정 모드:', courseId);
                    courseData.updatedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();

                    // Firestore 문서 업데이트
                    await window.dhcFirebase.db.collection('courses').doc(courseId).update(courseData);
                    window.adminAuth?.showNotification('교육 과정이 성공적으로 수정되었습니다.', 'success');
                } else {
                    // 추가 모드
                    console.log('교육 과정 추가 모드');
                    courseData.createdAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();
                    courseData.enrolledCount = 0;

                    // Firestore에 새 문서 추가
                    await window.dhcFirebase.db.collection('courses').add(courseData);
                    window.adminAuth?.showNotification('교육 과정이 성공적으로 추가되었습니다.', 'success');
                }
            } else {
                // 테스트 환경
                console.log('테스트 환경에서 과정 처리:', courseData);
                window.adminAuth?.showNotification('테스트 환경에서 처리되었습니다.', 'success');
            }

            // 모달 닫기
            this.closeCourseModal();

            // 목록 새로고침
            this.loadCourses();

        } catch (error) {
            console.error('교육 과정 처리 오류:', error);
            window.adminAuth?.showNotification('교육 과정 처리 중 오류가 발생했습니다.', 'error');
        }
    },

    /**
     * 교육 과정 상세 보기
     */
    viewCourse: async function (courseId) {
        try {
            let course;

            // 데이터 가져오기
            if (window.dhcFirebase && window.dhcFirebase.db) {
                const doc = await window.dhcFirebase.db.collection('courses').doc(courseId).get();

                if (doc.exists) {
                    course = {
                        id: doc.id,
                        ...doc.data()
                    };
                } else {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('해당 교육 과정을 찾을 수 없습니다.', 'error');
                    } else {
                        alert('해당 교육 과정을 찾을 수 없습니다.');
                    }
                    return;
                }
            } else {
                // 테스트용 더미 데이터
                course = {
                    id: courseId,
                    title: '건강운동처방사 기본과정',
                    certificateType: 'health-exercise',
                    instructor: '김운동',
                    startDate: new Date('2025-05-01'),
                    endDate: new Date('2025-06-30'),
                    price: 350000,
                    capacity: 30,
                    enrolledCount: 15,
                    status: 'active',
                    description: '건강운동처방사 자격증 취득을 위한 기본 과정입니다.'
                };
            }

            // 알림창으로 정보 표시 (실제로는 모달 등으로 구현)
            alert(`
                교육명: ${course.title}
                자격증: ${this.getCertificateName(course.certificateType)}
                강사: ${course.instructor}
                기간: ${this.formatDate(course.startDate)} ~ ${this.formatDate(course.endDate)}
                수강료: ${this.formatCurrency(course.price)}
                정원: ${course.enrolledCount || 0}/${course.capacity}명
                상태: ${course.status}
                설명: ${course.description || '내용 없음'}
            `);

        } catch (error) {
            console.error('교육 과정 상세 보기 오류:', error);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('교육 과정 정보를 불러오는데 실패했습니다.', 'error');
            } else {
                alert('교육 과정 정보를 불러오는데 실패했습니다.');
            }
        }
    },

    /**
     * 교육 과정 수정
     */
    editCourse: async function (courseId) {
        try {
            let course = null;

            // Firebase에서 과정 정보 가져오기
            if (window.dhcFirebase && window.dhcFirebase.db) {
                try {
                    const docRef = window.dhcFirebase.db.collection('courses').doc(courseId);
                    const docSnap = await docRef.get();

                    if (docSnap.exists) {
                        course = {
                            id: docSnap.id,
                            ...docSnap.data()
                        };
                    } else {
                        window.adminAuth?.showNotification('교육 과정을 찾을 수 없습니다.', 'error');
                        return;
                    }
                } catch (error) {
                    console.error('교육 과정 조회 오류:', error);
                    window.adminAuth?.showNotification('교육 과정을 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                course = {
                    id: courseId,
                    title: '건강운동처방사 기본과정',
                    certificateType: 'health-exercise',
                    instructor: '김운동',
                    startDate: new Date('2025-05-01'),
                    endDate: new Date('2025-06-30'),
                    price: 350000,
                    capacity: 30,
                    duration: 120,
                    enrolledCount: 15,
                    status: 'active',
                    description: '건강운동처방사 자격증 취득을 위한 기본 과정입니다.'
                };
            }

            // 모달 표시 및 데이터 채우기
            const modal = document.getElementById('course-modal');
            if (modal) {
                // 모달 제목 변경
                document.getElementById('course-modal-title').textContent = '교육 과정 수정';

                // 폼 데이터 채우기
                const form = document.getElementById('course-form');
                form.querySelector('#course-name').value = course.title || '';
                form.querySelector('#course-type').value = course.certificateType || '';
                form.querySelector('#course-description').value = course.description || '';
                form.querySelector('#course-price').value = course.price || '';
                form.querySelector('#course-capacity').value = course.capacity || '';
                form.querySelector('#course-duration').value = course.duration || '';

                // 날짜 형식 처리
                const formatDate = (date) => {
                    if (!date) return '';

                    const d = date instanceof Date ? date :
                        (date.toDate ? date.toDate() : new Date(date));

                    return d.toISOString().split('T')[0];
                };

                form.querySelector('#course-start-date').value = formatDate(course.startDate);
                form.querySelector('#course-end-date').value = formatDate(course.endDate);

                // 강사 설정
                form.querySelector('#course-instructor').value = course.instructor || '';

                // 상태 설정 (만약 상태 필드가 있다면)
                const statusField = form.querySelector('#course-status');
                if (statusField) {
                    statusField.value = course.status || 'preparing';
                }

                // 중요: 폼에 courseId 데이터 속성 추가 (수정 처리를 위해)
                form.setAttribute('data-course-id', courseId);

                // 모달 표시
                modal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('교육 과정 수정 준비 오류:', error);
            window.adminAuth?.showNotification('교육 과정 정보를 불러오는데 실패했습니다.', 'error');
        }
    },

    /**
     * 교육 과정 수정 처리
     */
    handleEditCourse: async function (courseId) {
        try {
            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            // 폼 데이터 수집
            const form = document.getElementById('course-form');
            const name = form.querySelector('#course-name').value;
            const certificateType = form.querySelector('#course-type').value;
            const description = form.querySelector('#course-description').value;
            const price = parseInt(form.querySelector('#course-price').value);
            const capacity = parseInt(form.querySelector('#course-capacity').value);
            const duration = parseInt(form.querySelector('#course-duration').value);
            const startDate = new Date(form.querySelector('#course-start-date').value);
            const endDate = new Date(form.querySelector('#course-end-date').value);
            const instructor = form.querySelector('#course-instructor').value;
            const status = form.querySelector('#course-status')?.value || 'preparing';

            // 유효성 검사
            if (!name || !certificateType || !price || !capacity || !startDate || !endDate || !instructor) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('모든 필수 항목을 입력하세요.', 'error');
                } else {
                    alert('모든 필수 항목을 입력하세요.');
                }
                return;
            }

            if (endDate <= startDate) {
                if (window.adminAuth && window.adminAuth.showNotification) {
                    window.adminAuth.showNotification('종료일은 시작일보다 이후여야 합니다.', 'error');
                } else {
                    alert('종료일은 시작일보다 이후여야 합니다.');
                }
                return;
            }

            // 수정할 데이터
            const courseData = {
                title: name,
                certificateType: certificateType,
                description: description,
                price: price,
                capacity: capacity,
                duration: duration,
                instructor: instructor,
                status: status,
                updatedAt: new Date()
            };

            // Firebase 저장
            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 타임스탬프로 변환
                courseData.startDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(startDate);
                courseData.endDate = window.dhcFirebase.firebase.firestore.Timestamp.fromDate(endDate);
                courseData.updatedAt = window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp();

                try {
                    // 기존 문서 업데이트
                    await window.dhcFirebase.db.collection('courses').doc(courseId).update(courseData);

                    // 성공 메시지
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 수정되었습니다.', 'success');
                    } else {
                        alert('교육 과정이 수정되었습니다.');
                    }

                    // 모달 닫기
                    this.closeCourseModal();

                    // 목록 새로고침
                    this.loadCourses();
                } catch (error) {
                    console.error('교육 과정 수정 오류:', error);
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('교육 과정 수정 중 오류가 발생했습니다.', 'error');
                    } else {
                        alert('교육 과정 수정 중 오류가 발생했습니다.');
                    }
                }
            } else {
                // 테스트 환경에서는 성공으로 처리
                setTimeout(() => {
                    if (window.adminAuth && window.adminAuth.showNotification) {
                        window.adminAuth.showNotification('교육 과정이 수정되었습니다.', 'success');
                    } else {
                        alert('교육 과정이 수정되었습니다.');
                    }

                    // 모달 닫기
                    this.closeCourseModal();

                    // 목록 새로고침
                    this.loadCourses();
                }, 1000);
            }
        } catch (error) {
            console.error('교육 과정 수정 처리 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('교육 과정 수정 중 오류가 발생했습니다.', 'error');
            } else {
                alert('교육 과정 수정 중 오류가 발생했습니다.');
            }
        } finally {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 날짜를 input[type="date"]용으로 포맷팅
     */
    formatDateToInput: function (date) {
        if (!date) return '';

        try {
            // Date 객체 확인
            if (!(date instanceof Date)) {
                date = new Date(date);
            }

            // 유효한 날짜인지 확인
            if (isNaN(date.getTime())) {
                return '';
            }

            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');

            return `${yyyy}-${mm}-${dd}`;
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '';
        }
    },

    /**
     * 교육 과정 삭제
     */
    deleteCourse: function (courseId) {
        if (confirm('정말로 이 교육 과정을 삭제하시겠습니까?')) {
            this.handleDeleteCourse(courseId);
        }
    },

    /**
     * 교육 과정 삭제 처리
     */
    handleDeleteCourse: async function (courseId) {
        try {
            // Firebase 삭제
            if (window.dhcFirebase && window.dhcFirebase.db) {
                await window.dhcFirebase.db.collection('courses').doc(courseId).delete();
            }

            // 성공 메시지
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('교육 과정이 삭제되었습니다.', 'success');
            } else {
                alert('교육 과정이 삭제되었습니다.');
            }

            // 목록 새로고침
            this.loadCourses();

        } catch (error) {
            console.error('교육 과정 삭제 오류:', error);

            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('교육 과정 삭제 중 오류가 발생했습니다.', 'error');
            } else {
                alert('교육 과정 삭제 중 오류가 발생했습니다.');
            }
        }
    },

    /**
     * 교육 과정 유형 변경
     */
    switchCourseType: function (type) {
        // 타입 저장
        this.currentCourseType = type;

        // 탭 활성화 상태 변경
        document.querySelectorAll('.course-tab').forEach(tab => {
            if (tab.getAttribute('data-course') === type) {
                tab.classList.remove('border-transparent', 'text-gray-500');
                tab.classList.add('border-indigo-500', 'text-indigo-600');
            } else {
                tab.classList.remove('border-indigo-500', 'text-indigo-600');
                tab.classList.add('border-transparent', 'text-gray-500');
            }
        });

        // 타입별 제목 업데이트
        document.getElementById('course-type-title').textContent = this.getCertificateName(type);

        // 목록 새로고침
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCourses();
    },

    /**
     * 자격증 이름 반환
     */
    getCertificateName: function (type) {
        const types = {
            'health-exercise': '건강운동처방사',
            'rehabilitation': '운동재활전문가',
            'pilates': '필라테스 전문가',
            'recreation': '레크리에이션지도자'
        };
        return types[type] || type;
    },

    /**
     * 날짜 포맷팅
     */
    formatDate: function (date) {
        if (!date) return '-';

        const d = date instanceof Date ? date : new Date(date?.seconds * 1000 || 0);
        return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '');
    },

    /**
     * input 요소용 날짜 포맷팅
     */
    formatDateForInput: function (date) {
        if (!date) return '';

        const d = date instanceof Date ? date : new Date(date?.seconds * 1000 || 0);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    },

    /**
     * 금액 포맷팅
     */
    formatCurrency: function (value) {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value).replace('₩', '') + '원';
    }
};

// 페이지 로드 완료 후 실행
window.addEventListener('DOMContentLoaded', function () {
    // 이미 script-loader.js에 의해 초기화되지 않았을 경우에만 실행
    if (!window.scriptLoaderInitialized) {
        console.log('교육 관리 페이지 초기화 (DOMContentLoaded)');

        // 전역 스코프에 courseManager 객체 추가
        window.courseManager = courseManager;

        // 초기화
        courseManager.init().catch(error => {
            console.error('교육 관리 페이지 초기화 오류:', error);
        });
    }
});