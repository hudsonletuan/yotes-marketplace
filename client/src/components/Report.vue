<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const props = defineProps<{
    postIdReport: string;
}>();

const userId = localStorage.getItem('userId');
const username = localStorage.getItem('username');
const userEmail = localStorage.getItem('userEmail');

const message = ref('');

const sendReport = async () => {
    if (message.value) {
        const reportData = {
            userId: userId,
            username: username,
            userEmail: userEmail,
            message: message.value,
            postId: props.postIdReport
        };
        try {
            const response = await axios.post('/api/sendreport', reportData);
            if (response.status === 200) {
                alert('Report sent successfully! You will be reached out soon.');
                message.value = '';
            }
        } catch (error) {
            alert('Failed to send report. Please try again later.');
        }
    } else {
        alert('Please enter your concern before sending the report.');
    }
};
</script>

<template>
    <div class="container">
        <textarea id="subject" name="subject" placeholder="What is your concern...?" style="height:200px" v-model="message"></textarea>
        <div class="button-group">
            <input type="button" value="Send Report" @click="sendReport">
            <button @click="$emit('close-report')">Cancel</button>
        </div>
    </div>
</template>

<style scoped>
input[type=text], textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  margin-top: 6px;
  margin-bottom: 16px;
  resize: vertical;
  font-family: 'Open Sans', sans-serif;
  font-size: 18px;
}

input[type=button] {
  background-color: #8b48ff;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color ease-in-out 0.2s;
}

input[type=button]:hover {
  background-color: #5d00ff;
  transition: background-color ease-in-out 0.2s;
}

.container {
  border-radius: 5px;
  background-color: #212529;
  padding: 20px;
  font-family: 'Open Sans', sans-serif;
}
.button-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.button-group button {
    background-color: #ff4848;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color ease-in-out 0.2s;
}
.button-group button:hover {
    background-color: #ff0000;
    transition: background-color ease-in-out 0.2s;
}
</style>