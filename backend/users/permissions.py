from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsSeniorCouncilOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow senior council or admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_senior_council
        )


class IsJuniorCouncilOrHigher(permissions.BasePermission):
    """
    Custom permission to only allow junior council or higher users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_senior_council or request.user.is_junior_council
        )


class CanManageUsers(permissions.BasePermission):
    """
    Custom permission to check if user can manage other users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_manage_users()


class CanViewAllTasks(permissions.BasePermission):
    """
    Custom permission to check if user can view all tasks.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_view_all_tasks()


class CanCreateTasks(permissions.BasePermission):
    """
    Custom permission to check if user can create tasks.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_create_tasks()


class CanEditTasks(permissions.BasePermission):
    """
    Custom permission to check if user can edit tasks.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_edit_tasks()


class CanDeleteTasks(permissions.BasePermission):
    """
    Custom permission to check if user can delete tasks.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_delete_tasks()


class CanManageNotes(permissions.BasePermission):
    """
    Custom permission to check if user can manage notes.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_manage_notes()


class CanViewAllReports(permissions.BasePermission):
    """
    Custom permission to check if user can view all reports.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_view_all_reports() 