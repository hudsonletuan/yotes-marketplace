<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close-otprecover']);

const otp = ref('');
const inputs = ref<NodeListOf<HTMLInputElement> | null>(null);
const remainingTime = ref(300);
const newPassword = ref('');
const reNewPassword = ref('');
const otpRight = ref(false);
const userEmailRight = ref('');

const countdown = () => {
    if (remainingTime.value > 0) {
        remainingTime.value--;
        setTimeout(countdown, 1000);
    }
};

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

onMounted(() => {
    countdown();
    inputs.value = document.querySelectorAll('.otp-field input');
    inputs.value.forEach((input, index) => {
        input.dataset.index = index.toString();
        input.addEventListener("paste", handleOnPasteOtp);
        input.addEventListener("keyup", handleOtp);
    });
});

function handleOnPasteOtp(e: ClipboardEvent) {
    const data = e.clipboardData?.getData("text");
    const value = (data ?? '').split("");
    if (value.length == inputs.value!.length) {
        inputs.value!.forEach((input, index) => (input.value = value[index]));
        submit();
    }
}

function handleOtp(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    let value = input.value;
    input.value = "";
    input.value = value ? value[0] : "";

    let fieldIndex = Number(input.dataset.index);
    if (value.length > 0 && fieldIndex < inputs.value!.length - 1) {
        const nextSibling = input.nextElementSibling as HTMLElement | null;
        if (nextSibling && 'focus' in nextSibling) {
            nextSibling.focus();
        }
    }

    if (e.key == "Backspace" && fieldIndex > 0 && !input.value) {
        const prevSibling = input.previousElementSibling as HTMLElement | null;
        if (prevSibling && 'focus' in prevSibling) {
            prevSibling.focus();
        }
    }

    if (fieldIndex == inputs.value!.length - 1 && input.value.length === 1) {
        submit();
    }
}

function enableInputs() {
    if (inputs.value) {
        inputs.value.forEach((input) => {
            input.disabled = false;
            input.classList.remove("disabled");
        });
    }
}

const validOTP = ref('');

const verifyOTP = async () => {
    if (otp.value !== validOTP.value) {
        alert('Invalid OTP');
        enableInputs();
        return;
    } else {
        otpRight.value = true;
    }
};

const resetPassword = async () => {
    if (!newPassword.value || !reNewPassword.value) {
        alert('Please fill in all fields');
        return;
    }
    if (newPassword.value !== reNewPassword.value) {
        alert('Passwords do not match');
        return;
    }
    if (reNewPassword.value.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    const formData = new FormData();
    formData.append('email', userEmailRight.value);
    formData.append('reNewPassword', reNewPassword.value);

    try {
        const response = await axios.post('/api/changepassword', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            alert('Password reset successful');
            location.reload();
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Password reset failed');
            console.error('Password reset failed:', error);
        }
    }
};

const recoverBtn = ref(true);
const userInfo = ref('');
const emailRegex = /^[^\s@]+@(?:collegeofidaho\.edu|[a-z]+\.collegeofidaho\.edu)$/i;

const recoverOTP = async () => {
    if (!userInfo.value) {
        alert('Please fill in your username or email address');
        return;
    }
    const formData = new FormData();
    if (emailRegex.test(userInfo.value)) {
        formData.append('email', userInfo.value);
    } else {
        formData.append('username', userInfo.value);
    }
    try {
        const response = await axios.post('/api/recoverOTP', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            recoverBtn.value = false;
            userEmailRight.value = response.data.userEmail;
            validOTP.value = response.data.otpCache[response.data.userEmail].otp;
            remainingTime.value = 300;
            countdown();
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Request OTP failed');
            console.error('Request OTP failed:', error);
        }
    }
};

function submit() {
    otp.value = '';
    if (inputs.value) {
        inputs.value.forEach((input) => {
            otp.value += input.value;
            input.disabled = true;
            input.classList.add("disabled");
        });
    }
    //otp.value = Array.from(inputs.value!).map(input => input.value).join('');
    verifyOTP();
}
</script>

<template>
    <div class="otp-verify-container">
        <div class="main">
            <div class="user-field">
                <input type="text" placeholder="Username/Email" autocomplete="off" role="presentation" v-model="userInfo" />
                <div v-if="recoverBtn" ref="recoverBtn" class="recover-btn-wrapper">
                    <button class="recover-btn" @click="recoverOTP">Recover Account</button>
                </div>
            </div>
            <div v-show="!recoverBtn && !otpRight" class="otp-field">
                <input type="text" onkeypress="return /[0-9]/i.test(event.key)" maxlength="1" />
                <input type="text" onkeypress="return /[0-9]/i.test(event.key)" maxlength="1" />
                <input type="text" onkeypress="return /[0-9]/i.test(event.key)" maxlength="1" />
                <input type="text" onkeypress="return /[0-9]/i.test(event.key)" maxlength="1" />
                <input type="text" onkeypress="return /[0-9]/i.test(event.key)" maxlength="1" />
                <input type="text" onkeypress="return /[0-9]/i.test(event.key)" maxlength="1" />
            </div>
            <div v-if="!recoverBtn && !otpRight" class="action">
                <div class="timeCount" v-show="remainingTime > 0">
                    <p>An OTP has been sent to your registered email</p>
                    <p>Resend another OTP in: {{ formatTime(remainingTime) }}</p>
                </div>
                <div class="timeEnd" v-show="remainingTime <= 0">
                    <p>An OTP has been sent to your registered email</p>
                    <p>Click on Resend OTP to get a new one</p>
                    <div class="buttons">
                        <button @click="recoverOTP">Resend OTP</button>
                        <button class="close-btn" @click="$emit('close-otprecover')">Close</button>
                    </div>
                </div>
            </div>
            <div v-if="otpRight" class="resetPassword">
                <p>OTP confirmed. Reset your password now.</p>
                <input type="password" placeholder="New Password" v-model="newPassword" />
                <input type="password" placeholder="Re-enter New Password" v-model="reNewPassword" />
                <button class="reset-pass-btn" @click="resetPassword">Change Password</button>
            </div>
            <div class="buttons" v-show="remainingTime > 0">
                <button class="close-btn-general" @click="$emit('close-otprecover')">Close</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.user-field input {
    width: 100%;
    font-size: 1.1em;
    font-weight: 500;
    padding: 10px;
    text-align: center;
    border-radius: 5px;
    margin: 4px;
    border: 2px solid rgb(0, 0, 0, 0.2);
    background: rgb(0, 0, 0, 0.1);
    color: rgb(0, 0, 0, 0.8);
    outline: none;
    transition: all 0.1s;
}
.recover-btn-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
}
.recover-btn, .reset-pass-btn {
    background: #7a4dc7;
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;
    font-size: 16px;
    padding: 10px;
    transition: ease-in 0.2s;
}
.recover-btn:hover, .reset-pass-btn:hover {
    background: #54348f;
    transition: ease-in 0.2s;
}
.otp-field {
    display: flex;
    justify-content: center;
}
.otp-field input {
    width: 40px;
    font-size: 1.1em;
    font-weight: 500;
    padding: 10px;
    text-align: center;
    border-radius: 5px;
    margin: 4px;
    border: 2px solid rgb(0, 0, 0, 0.2);
    background: rgb(0, 0, 0, 0.1);
    color: rgb(0, 0, 0, 0.8);
    outline: none;
    transition: all 0.1s;
}
.otp-field input:focus {
    border: 2px solid rgb(84, 52, 143);
    box-shadow: 0 0 2px 2px rgb(84, 52, 143, 0.3);
}
.resetPassword {
    margin: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: .5rem;
}
.resetPassword input {
    padding: 10px;
    margin: 3px;
    border: 2px solid rgb(0, 0, 0, 0.5);
    border-radius: 10px;
}
.disabled {
    opacity: 0.5;
}
.buttons {
    margin-top: 5px;
    display: flex;
    justify-content: center;
}
.timeCount, .timeEnd {
    text-align: center;
    margin-top: 5px;
    color: rgba(70, 70, 70, 0.8);
    font-size: 14px;
}
.buttons button {
    background: #7a4dc7;
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;
    font-size: 16px;
    padding: 10px;
    transition: ease-in 0.2s;
}
.buttons button:hover {
    background: #54348f;
    transition: ease-in 0.2s;
}
.close-btn {
    background: #c74d4d !important;
    margin-left: 10px;
}
.close-btn:hover, .close-btn-general:hover {
    background: #8f3434 !important;
}
.close-btn-general {
    background: #c74d4d !important;
}

</style>