<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';

const props = defineProps<{
    userId: string;
    username: string;
}>();

onMounted(() => {
  newUsername.value = props.username;
});

const emit = defineEmits(['close-changeusername']);
const newUsername = ref('');
const password = ref('');

const changeUsername = async () => {
    if (!newUsername.value || !password.value) {
        alert('Please fill out all fields');
        return;
    }
    if (newUsername.value === props.username) {
        alert('New username cannot be the same as the current username');
        return;
    }
    if (newUsername.value.length < 6 || newUsername.value.length > 12) {
        alert('Username must be at least 6 characters and a maximum of 12 characters');
        return;
    }
    const letters = newUsername.value.match(/[a-zA-Z]/g);
    if (!letters || letters.length < 4) {
        alert('Username must contain at least 4 letters');
        return;
    }
    const formData = new FormData();
    formData.append('userId', props.userId);
    formData.append('newUsername', newUsername.value);
    formData.append('password', password.value);

    try {
        const response = await axios.post('/api/changeusername', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            alert('Username changed successfully');
            localStorage.setItem('username', newUsername.value);
            location.reload();
            emit('close-changeusername');
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Username change failed');
            //console.error('Username change failed:', error);
        }
    }
};
</script>

<template>
    <div class="change-username">
        <input type="newusername" placeholder="New Username" v-model="newUsername" />
        <input type="password" placeholder="Password" v-model="password" />
        <button class="change-username-btn" @click="changeUsername">Change Username</button>
        <button class="close-btn" @click="$emit('close-changeusername')">Cancel</button>
    </div>
</template>

<style scoped>
.change-username {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}
.change-username input {
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
.change-username-btn {
    background-color: #007bff;
}
.change-username-btn:hover {
    background-color: #0056b3;
}
.close-btn {
    background-color: #dc3545;
}
.close-btn:hover {
    background-color: #bd2130;
}
</style>