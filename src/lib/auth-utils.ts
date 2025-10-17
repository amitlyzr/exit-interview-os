import Cookies from 'js-cookie';

export interface UserData {
    user_id: string;
    email?: string;
    token: string;
    org_id?: string;
    is_hr?: boolean;
}

export const getUserDataFromCookies = (): UserData | null => {
    try {
        const user_id = Cookies.get('user_id');
        const token = Cookies.get('token');
        const org_id = Cookies.get('organization_id');
        const email = Cookies.get('email');

        if (!user_id || !token) {
            return null;
        }

        return {
            user_id,
            token,
            org_id,
            email,
        };
    } catch (error) {
        console.error('Error getting user data from cookies:', error);
        return null;
    }
};

export const createOrGetUser = async (userData: UserData): Promise<{ user: UserData & { is_hr: boolean; created_at: Date; updated_at: Date }; isHR: boolean } | null> => {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (result.success) {
            return {
                user: result.user,
                isHR: result.user.is_hr || result.isHR || false
            };
        } else {
            console.error('Failed to create/get user:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error creating/getting user:', error);
        return null;
    }
};

export const checkHRAccess = async (user_id: string, org_id?: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/users?user_id=${user_id}`);
        const result = await response.json();

        if (result.success && result.user) {
            // Check if user is HR and from the same org
            return result.user.is_hr === true && (!org_id || result.user.org_id === org_id);
        }

        return false;
    } catch (error) {
        console.error('Error checking HR access:', error);
        return false;
    }
};
