<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close-changepassword']);
const oldPassword = ref('');
const newPassword = ref('');
const reNewPassword = ref('');

const props = defineProps<{
    userId: string;
}>();

const changePassword = async () => {
    if (!oldPassword.value || !newPassword.value || !reNewPassword.value) {
        alert('Please fill in all fields');
        return;
    }
    if (newPassword.value !== reNewPassword.value) {
        alert('New passwords do not match');
        return;
    }
    if (reNewPassword.value.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    if (oldPassword === reNewPassword) {
        alert('New password cannot be the same as the old password');
        return;
    }
    const formData = new FormData();
    formData.append('userId', props.userId);
    formData.append('oldPassword', oldPassword.value);
    formData.append('reNewPassword', reNewPassword.value);

    try {
        const response = await axios.post('/api/changepassword', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            alert('Password changed successfully');
            emit('close-changepassword');
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Password change failed');
            //console.error('Password change failed:', error);
        }
    }
};
</script>

<template>
    <div class="change-password">
        <input type="password" placeholder="Old Password" v-model="oldPassword" />
        <input type="password" placeholder="New Password" v-model="newPassword" />
        <input type="password" placeholder="Re-enter New Password" v-model="reNewPassword" />
        <button class="change-pass-btn" @click="changePassword">Change Password</button>
        <button class="close-btn" @click="$emit('close-changepassword')">Cancel</button>
    </div>
</template>

<style scoped>
.change-password {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}
.change-password input {
    padding: 10px;
    margin: 3px;
    border: none;
    border-radius: 10px;
}
button {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: .2s ease-in-out;
}
button:hover {
    transition: .2s ease-in-out;
}
.change-pass-btn {
    background-color: #007bff;
}
.change-pass-btn:hover {
    background-color: #0056b3;
}
.close-btn {
    background-color: #dc3545;
}
.close-btn:hover {
    background-color: #bd2130;
}
</style>