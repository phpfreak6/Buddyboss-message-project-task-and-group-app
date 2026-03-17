import { NODE_BACKEND } from '@env';
import superagentPromise from "superagent-promise";
import _superagent from "superagent";

const superagent = superagentPromise(_superagent, global.Promise);

const API_ROOT = NODE_BACKEND;

let token = null;

const tokenPlugin = (req) => {
  if (token) {
    req.set("Authorization", `Bearer ${token}`);
  }
  req.set("Cache-Control", `no-cache`);
};

// Log response body
const responseBody = (res) => {
  //console.log("Response Body:", res.body);  // Log the response body
  return res.body;
};

// Error handler for all requests
const handleError = (error) => {


  // If it's a network error or timeout error
  if (error.response) {
    // Check the status code
    const { status, body } = error.response;

    let errorData = {message: ""};

    
    // Handle specific status codes
    switch (status) {
      case 400:
        errorData.message = body.message || "Invalid request";
        console.error("Bad Request:", errorData.message);
        break;
      case 401:
        errorData.message = (body && body.message) ? body.message : "Authentication failed";
        console.error("Unauthorized:", errorData.message);
        break;
      case 403:
        errorData.message = (body && body.message) ? body.message :  "Access denied";
        console.error("Forbidden:", errorData.message);
        break;
      case 404:
        errorData.message = (body && body.message) ? body.message :  "Resource not found";
        console.error("Not Found:", errorData.message);
        break;
      case 500:
        errorData.message = (body && body.message) ? body.message :  "An error occurred on the server";
        console.error("Server Error:", errorData.message);
        break;
      case 503:
        errorData.message = (body && body.message) ? body.message :  "Server not working";
        console.error("Server Error:", errorData.message);
        break;  
      default:
        errorData.message = (body && body.message) ? body.message : "An error occurred";
        console.error("Error:", errorData.message);
        break;
    }
    
    return {failed:true,error: errorData};
  } else {
    console.error("Network Error:", error.message || "Failed to connect");
    return {failed:true,error};
  }
  // You can also return a specific error object or a fallback error message
  
};

const requests = {
  del: (url) =>
    superagent
      .del(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .then(responseBody)
      .catch(handleError),

  get: (url) => {
    console.debug(`GET Request to: ${API_ROOT}${url}`);  // Log the request URL
    return superagent
      .get(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .then(responseBody)
      .catch(handleError);
  },

  put: (url, body) =>
    superagent
      .put(`${API_ROOT}${url}`, body)
      .use(tokenPlugin)
      .then(responseBody)
      .catch(handleError),
  
  post: (url, body) => {
    console.debug(`POST Request to: ${API_ROOT}${url}`, body); // Log the request URL and body
    return superagent
      .post(`${API_ROOT}${url}`, body)
      .use(tokenPlugin)
      .then(responseBody)
      .catch(handleError);
  },
  postFormData: (url, body) => {
    console.debug(`POST Request to: ${API_ROOT}${url}`, body);
    return superagent
      .post(`${API_ROOT}${url}`)
      .use(tokenPlugin)
      .send(body)
      .then(responseBody)
      .catch(handleError);
  },
};

const Auth = {
  current: () => requests.get("/auth/user"),
  login: (formData) => requests.post("/auth/login", formData),
  logout: (user_id) => requests.post("/auth/logout", {user_id}),
  saveFcmToken: (fcmToken) => requests.post("/auth/saveFcmToken", {fcmToken}),
  updateProfile: (formData) => requests.post("/auth/updateProfile", formData),
  ForgotPassword: (formData) => requests.post("/auth/ForgotPassword", formData),
  ChangePassword: (formData) => requests.post("/auth/ChangePassword", formData),
  getUsers: (pageNumber, pageSize, search) =>
    requests.get(`/users/getUsers?page=${pageNumber}&size=${pageSize}&search=${search}`),
  getSettings: () => requests.get(`/settings/getSettings/`),
  getCustomMenus: () => requests.get(`/users/getCustomMenus/`),
  getMessages: (search, pageNumber, limit) => requests.get(`/messages/getMessages/?search=${search}&limit=${limit}&page=${pageNumber}`),
  getThreadMessages: (threadId, pageNumber) => requests.get(`/messages/getThreadMessages/?threadId=${threadId}&page=${pageNumber}`),
  sendMessage: (threadId, message) => requests.postFormData(`/messages/sendMessage/?threadId=${threadId}`, message),
  fetchUnreadMessage: () => requests.get("/messages/fetchUnreadMessage"),
  fetchUserProfileData: (userId) => requests.get(`/users/fetchUserProfileData/${userId}`),
  seenMessage: (messageId) => requests.get(`/messages/seenMessage/${messageId}`),
  getSeenUsers: (messageId) => requests.get(`/messages/getSeenUsers/${messageId}`),
  getReactions: (messageId) => requests.get(`/messages/getReactions/${messageId}`),
  addReaction: (messageId, emoji) => requests.post(`/messages/addReaction/${messageId}`, { emoji }),
  removeReaction: (messageId, emoji) => requests.post(`/messages/removeReaction/${messageId}`, { emoji }),
  getCourses: (pageNumber, pageSize, search, sortBy = "", courseFilter="") =>
    requests.get(`/courses/getCourses?page=${pageNumber}&size=${pageSize}&search=${search}&sortBy=${sortBy}&courseFilter=${courseFilter}`),
  fetchCourseData: (courseId) => requests.get(`/courses/fetchCourseData/${courseId}`),
  fetchCourseStepData: (stepId) => requests.get(`/courses/fetchCourseStepData/${stepId}`),
  fetchCourseQuizData: (stepId) => requests.get(`/courses/fetchCourseQuizData/${stepId}`),
  markStepComplete: (courseId, stepId) => requests.post(`/courses/markStepComplete/`, {courseId, stepId}),
  updateUserProfileData: (formData) => requests.post(`/users/updateUserProfileData/`, formData),
  deleteCoverPhoto: (formData) => requests.post(`/users/deleteCoverPhoto/`, formData),
  deleteProfilePhoto: (formData) => requests.post(`/users/deleteProfilePhoto/`, formData),
  updateCustomMenus: (formData) => requests.post(`/users/updateCustomMenus/`, formData),
  getNotifications: (pageNumber, pageSize, active) => requests.get(`/users/getNotifications/?page=${pageNumber}&size=${pageSize}&active=${active}`),
  markNotificationAsRead: (notificationId) => requests.post(`/users/markNotificationAsRead/`, { notificationId }),
  getUnreadNotificationCount: () => requests.get("/users/getUnreadNotificationCount/"),
  deleteNotification: (notificationId) => requests.post(`/users/deleteNotification/`, { notificationId }),
  editMessage: (messageId, message) => requests.post(`/messages/editMessage/${messageId}`, { message }),
  deleteMessage: (messageId) => requests.post(`/messages/deleteMessage/${messageId}`,{delete:true}),
};

const common = {
  getPrivacyPolicy: () => requests.get("/pages/getPrivacyPolicy"),
};
const Groups = {
  getGroups: (pageNumber, pageSize, search, sortBy = "", groupFilter="") =>
    requests.get(`/groups/getGroups?page=${pageNumber}&size=${pageSize}&search=${search}&sortBy=${sortBy}&groupFilter=${groupFilter}`),
  createGroup: (formData) => requests.post(`/groups/createGroup/`, formData),
  updateDetails: (group_id,formData) => requests.post(`/groups/updateDetails/${group_id}`, formData),
  getdetails: (group_id) => requests.get(`/groups/getdetails/${group_id}`),
  updateGroupSettings: (group_id,formData) => requests.post(`/groups/updateGroupSettings/${group_id}`, formData),
  updateGroupForum: (group_id,formData) => requests.post(`/groups/updateGroupForum/${group_id}`, formData),
  removeGroupPhoto: (group_id,formData) => requests.post(`/groups/removeGroupPhoto/${group_id}`, formData),
  removeGroupCoverPhoto: (group_id,formData) => requests.post(`/groups/removeGroupCoverPhoto/${group_id}`, formData),
  getGroupMembers: (group_id) => requests.get(`/groups/getGroupMembers/${group_id}`),
  getGroupAllUsers: (group_id,pageNumber, pageSize, search) => requests.get(`/groups/getGroupAllUsers/${group_id}?page=${pageNumber}&size=${pageSize}&search=${search}`),
  sendGroupInvites: (group_id, memberIds, inviteMessage, directAccess=false) => requests.post(`/groups/sendGroupInvites/${group_id}`, { memberIds, inviteMessage, directAccess }),
  updateGroupCourse: (group_id,formData) => requests.post(`/groups/updateGroupCourse/${group_id}`, formData),
  getPendingGroups: () => requests.get(`/groups/getPendingGroups/`),
  acceptGroup: (group_id) => requests.post(`/groups/acceptGroup/${group_id}`),
  rejectGroup: (group_id) => requests.post(`/groups/rejectGroup/${group_id}`),
  getGroupFeed: (group_id, pageNumber, pageSize) => requests.get(`/groups/getGroupFeed/${group_id}?page=${pageNumber}&size=${pageSize}`),
  likeGroupFeed: (group_id, activity_id) => requests.post(`/groups/likeGroupFeed/${group_id}`, { activity_id }),
  deleteGroupFeed: (group_id, activity_id) => requests.post(`/groups/deleteGroupFeed/${group_id}`, { activity_id }),
  createGroupPost: (group_id, formData) => requests.post(`/groups/createGroupPost/${group_id}`, formData),
  getGroupMembersBySearch: (group_id, pageNumber, pageSize, search) => requests.get(`/groups/getGroupMembersBySearch/${group_id}?page=${pageNumber}&size=${pageSize}&search=${search}`),
  getGroupFeedComments: (group_id, activity_id) => requests.get(`/groups/getGroupFeedComments/${group_id}?activity_id=${activity_id}`),
  getFeedById: (group_id,activity_id) => requests.get(`/groups/getFeedById/${group_id}?activity_id=${activity_id}`),
  getGroupPhotos: (group_id, pageNumber, pageSize) => requests.get(`/groups/getGroupPhotos/${group_id}?page=${pageNumber}&size=${pageSize}`),
  getGroupVideos: (group_id, pageNumber, pageSize) => requests.get(`/groups/getGroupVideos/${group_id}?page=${pageNumber}&size=${pageSize}`),
  deleteGroupPhoto: (group_id, photo_id) => requests.post(`/groups/deleteGroupPhoto/${group_id}`, { photo_id }),
  updateGroupPhotoDetail: (group_id, photo_id, formData) => requests.post(`/groups/updateGroupPhotoDetail/${group_id}/${photo_id}`, formData),
  deleteGroup: (group_id) => requests.post(`/groups/deleteGroup/${group_id}`,{delete:true}),
  leaveGroup: (group_id) => requests.post(`/groups/leaveGroup/${group_id}`,{leave:true}),
  checkGroupMessage: (group_id) => requests.get(`/groups/checkGroupMessage/${group_id}`),
  removeGroupMember: (group_id, member_id) => requests.post(`/groups/removeGroupMember/${group_id}`, { member_id }),
  demoteGroupMember: (group_id, member_id) => requests.post(`/groups/demoteGroupMember/${group_id}`, { member_id }),
  getGroupCourses: (group_id) => requests.get(`/groups/getGroupCourses/${group_id}`),
  
};

const Projects = {
  getProjects: ({ search = '', filter = 'all', category = '', limit = 20, page = 1 } = {}) => {
    const params = new URLSearchParams({
      search,
      status: filter,
      limit: limit.toString(),
      page: page.toString(),
    });
    if (category) {
      params.append('category', category.toString());
    }
    return requests.get(`/projects/getMyProjects?${params.toString()}`);
  },
  getProject: (projectId) => requests.get(`/projects/getProjectDetails/${projectId}`),
  createProject: (projectData) => requests.post(`/projects/createProject`, projectData),
  updateProject: (projectId, projectData) => requests.post(`/projects/updateProject`, { id: projectId, ...projectData }),
  deleteProject: (projectId) => requests.post(`/projects/deleteProject`, { id: projectId }),
  toggleProjectFavorite: (projectId, isFavourite) => requests.post(`/projects/favourite_project`, { id: projectId, favourite: isFavourite }),
  updateProjectStatus: (projectId, status) => requests.post(`/projects/updateProjectStatus`, { id: projectId, status }),
  getProjectCategories: () => requests.get(`/projects/getCategories`),
  getCategories: () => requests.get(`/projects/getAdminCategories`),
  createCategory: (categoryData) => requests.post(`/projects/createCategory`, categoryData),
  updateCategory: (categoryId, categoryData) => requests.post(`/projects/updateCategory`, { id: categoryId, ...categoryData }),
  deleteCategory: (categoryId) => requests.post(`/projects/deleteCategory`, { id: categoryId }),
  addUserToProject: (projectId, userId) => requests.post(`/projects/addUserToProject`, { project_id: projectId, user_id: userId }),
  removeUserFromProject: (projectId, userId) => requests.post(`/projects/removeUserFromProject`, { project_id: projectId, user_id: userId }),
};

const Tasks = {
  getMyTasks: ({ filter = 'all', search = '', limit = 50, page = 1 } = {}) => {
    const params = new URLSearchParams({
      filter,
      search,
      limit: limit.toString(),
      page: page.toString(),
    });
    return requests.get(`/tasks/getMyTasksNew?${params.toString()}`);
  },
  getTaskLists: (projectId) => requests.get(`/tasks/getTaskLists/${projectId}`),
  getTaskByListId: (projectId, taskListId) => requests.get(`/tasks/${projectId}/${taskListId}/getTaskByListId`),
  getTaskById: (projectId, taskId) => requests.get(`/tasks/${projectId}/${taskId}/getTaskById`),
  createTaskList: (projectId, taskListData) => requests.post(`/tasks/createTaskList`, { project_id: projectId, ...taskListData }),
  updateTaskList: (projectId, taskListId, taskListData) => requests.put(`/tasks/updateTaskList`, { project_id: projectId, task_list_id: taskListId, ...taskListData }),
  deleteTaskList: (projectId, taskListId) => requests.post(`/tasks/${projectId}/${taskListId}/deleteTaskList`, {}),
  createTask: (projectId, taskData) => requests.post(`/tasks/${projectId}/createTask`, taskData),
  updateTask: (projectId, taskId, taskData) => requests.put(`/tasks/${projectId}/${taskId}/update`, taskData),
  updateTaskOrder: (projectId, taskListId, taskOrders) => requests.put(`/tasks/${projectId}/${taskListId}/updateTaskOrder`, { task_orders: taskOrders }),
  deleteTask: (projectId, taskListId, taskId) => requests.post(`/tasks/${projectId}/${taskId}/deleteTask`, { delete: true, task_list_id: taskListId }),
  addAssigneeToTask: (projectId, taskId, assigneeId) => requests.post(`/tasks/${projectId}/${taskId}/addAssignee`, { assignee_id: assigneeId }),
  removeAssigneeFromTask: (projectId, taskId, assigneeId) => requests.post(`/tasks/${projectId}/${taskId}/removeAssignee`, { assignee_id: assigneeId }),
  getTaskComments: (projectId, taskId) => requests.get(`/tasks/${projectId}/${taskId}/getComments`),
  getTaskActivities: (projectId, taskId) => requests.get(`/tasks/${projectId}/${taskId}/getActivities`),
  addTaskComment: (projectId, taskId, commentData) =>
    commentData instanceof FormData
      ? requests.postFormData(`/tasks/${projectId}/${taskId}/createComment`, commentData)
      : requests.post(`/tasks/${projectId}/${taskId}/createComment`, commentData),
  updateTaskComment: (projectId, taskId, commentId, commentData) =>
    requests.put(`/tasks/${projectId}/${taskId}/updateComment/${commentId}`, commentData),
  deleteTaskComment: (projectId, taskId, commentId) =>
    requests.del(`/tasks/${projectId}/${taskId}/deleteComment/${commentId}`),
  uploadTaskAttachment: (projectId, taskId, formData) => requests.postFormData(`/tasks/${projectId}/${taskId}/uploadAttachment`, formData),
  deleteTaskAttachment: (projectId, taskId, fileId) =>
    requests.del(`/tasks/${projectId}/${taskId}/deleteAttachment/${fileId}`),
};

export default {
  Auth,
  common,
  Groups,
  Projects,
  Tasks,
  setToken: (_token) => {
    token = _token;
  },
};
