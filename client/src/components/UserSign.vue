<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close-usersign']);

const usernameEmail = ref('');
const passwordLogin = ref('');
const username = ref('');
const email = ref('');
const passwordSignUp = ref('');
const rePasswordSignUp = ref('');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginUser = async () => {
    const formData = new FormData();
    const { value: usernameEmailValue } = usernameEmail;
    if (emailRegex.test(usernameEmailValue)) {
        formData.append('email', usernameEmailValue);
    } else {
        formData.append('username', usernameEmailValue);
    }
    formData.append('password', passwordLogin.value);
    try {
        const response = await axios.post('/api/login', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            alert('Login successful');
            localStorage.setItem('username', response.data.user.username);
            localStorage.setItem('userImg', response.data.user.img);
            location.reload();
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Login failed');
            console.error('Login failed:', error);
        }
    }
};
const signupUser = async () => {
    const formData = new FormData();
    formData.append('username', username.value);
    formData.append('email', email.value);
    if (passwordSignUp.value !== rePasswordSignUp.value) {
        alert('Passwords do not match');
        return;
    }
    formData.append('password', rePasswordSignUp.value);

    try {
        const response = await axios.post('/api/signup', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 201) {
            alert('Sign up successful');
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Sign up failed');
            console.error('Sign up failed:', error);
        }
    }
};

</script>

<template>
    <div class="sign-backdrop">
        <div class="user-sign-container">
            <div class="main">
                <input type="checkbox" id="chk" aria-hidden="true">
                    <div class="login">
                        <button class="close-btn" @click="$emit('close-usersign')">&#10006;</button>
                        <div class="form-temp">
                            <label for="chk" aria-hidden="true">Login</label>
                            <input type="text" name="usernameemail" placeholder="Username/Email" autocomplete="off" role="presentation" v-model="usernameEmail" required>
                            <input type="password" name="pswd" placeholder="Password" v-model="passwordLogin" required>
                            <button @click="loginUser">Login</button>
                        </div>
                    </div>
                    <div class="signup">
                        <div class="form-temp">
                            <label for="chk" aria-hidden="true">Sign up</label>
                            <input type="text" name="txt" placeholder="Username" autocomplete="off" role="presentation" v-model="username" required>
                            <input type="email" name="email" placeholder="Email" autocomplete="off" role="presentation" v-model="email" required>
                            <input type="password" name="pswd" placeholder="Password" v-model="passwordSignUp" required>
                            <input type="password" name="re-pswd" placeholder="Re-enter Password" v-model="rePasswordSignUp" required>
                            <button @click="signupUser">Sign Up</button>
                        </div>
                    </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&display=swap');
* {
    font-family: 'Jost', sans-serif;
    box-sizing: border-box;
}

.user-sign-container {
	margin: 0;
	padding: 0;
	display: flex;
	justify-content: center;
	align-items: center;
}
.main{
	width: 350px;
	height: 500px;
	overflow: hidden;
	background: rgb(65,4,103);
    background: radial-gradient(circle, rgba(65,4,103,1) 0%, rgba(101,51,209,1) 0%, rgba(65,4,103,1) 100%);
	border-radius: 10px;
	box-shadow: 5px 20px 50px #000;
}
#chk{
	display: none;
}
.login{
	position: relative;
	width:100%;
	height: 100%;
}
label{
	color: #fff;
	font-size: 2.3em;
	justify-content: center;
	display: flex;
	margin: 60px;
	font-weight: bold;
	cursor: pointer;
	transition: .5s ease-in-out;
}
input{
	width: 70%;
	height: 30px;
	background: #e0dede;
	justify-content: center;
	display: flex;
	margin: 15px auto;
	padding: 10px;
	border: none;
	outline: none;
	border-radius: 5px;
    font-size: 16px;
}
button{
	width: 60%;
	height: 40px;
	margin: 10px auto;
	justify-content: center;
	display: block;
	color: #fff;
	background: #7a4dc7;
	font-size: 20px;
	font-weight: bold;
	margin-top: 20px;
	outline: none;
	border: none;
	border-radius: 5px;
	transition: .2s ease-in;
	cursor: pointer;
    border: 2px solid #ffffff;
}
button:hover{
	background: #54348f;
}
.signup{
	height: 460px;
	background: #eee;
	border-radius: 60% / 10%;
	transform: translateY(-180px);
	transition: .8s ease-in-out;
}
.signup label{
	color: #573b8a;
	transform: scale(.6);
}

#chk:checked ~ .signup{
	transform: translateY(-500px);
}
#chk:checked ~ .signup label{
	transform: scale(1);	
}
#chk:checked ~ .login label{
	transform: scale(.6);
}
.close-btn {
    position: absolute;
    top: -60px;
    right: 20px;
    border: none;
    color: white;
    cursor: pointer;
    padding: 5px;
    font-size: 20px;
    background-color: rgba(148, 148, 148, 0.5);
    border-radius: 50%;
    transition: background-color 0.2s ease-in-out;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.close-btn:hover {
    background-color: rgba(113, 113, 113, 0.5);
}
</style>