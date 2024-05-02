<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close-otpverify']);

const props = defineProps<{
    username: string;
    email: string;
    password: string;
}>();

const otp = ref('');
const inputs = ref<NodeListOf<HTMLInputElement> | null>(null);
const remainingTime = ref(10);

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

    if (e.key == "Backspace" && fieldIndex > 0) {
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

const verifyOTP = async () => {
    const formData = new FormData();
    formData.append('username', props.username);
    formData.append('email', props.email);
    formData.append('password', props.password);
    formData.append('otp', otp.value);

    try {
        const response = await axios.post('/api/signupVerify', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.user.username);
            localStorage.setItem('userImg', response.data.user.img);
            localStorage.setItem('userId', response.data.user.id);
            alert('Sign up successful');
            location.reload();
            emit('close-otpverify');
        } else {
            alert(response.data.message);
            enableInputs();

        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
            enableInputs();
        } else {
            alert('Verify OTP failed');
            console.error('Verify OTP failed:', error);
            enableInputs();
        }
    }
};

const resendOTP = async () => {
    const formData = new FormData();
    formData.append('email', props.email);
    try {
        const response = await axios.post('/api/resendOTP', formData, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });
        if (response.status === 200) {
            remainingTime.value = 10;
            countdown();
        } else {
            alert(response.data.message);
        }
    } catch (error) {
        if ((error as any).response.status === 400) {
            alert((error as any).response.data.message);
        } else {
            alert('Resend OTP failed');
            console.error('Resend OTP failed:', error);
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
            <div class="otp-field">
                <input type="text" maxlength="1" />
                <input type="text" maxlength="1" />
                <input type="text" maxlength="1" />
                <input type="text" maxlength="1" />
                <input type="text" maxlength="1" />
                <input type="text" maxlength="1" />
            </div>
            <div class="action">
                <div class="timeCount" v-show="remainingTime > 0">
                    <p>An OTP has been sent to your registered email</p>
                    <p>Resend another OTP in: {{ formatTime(remainingTime) }}</p>
                </div>
                <div class="timeEnd" v-show="remainingTime <= 0">
                    <p>An OTP has been sent to your registered email</p>
                    <p>Click on Resend OTP to get a new one</p>
                    <div class="buttons">
                        <button @click="resendOTP">Resend OTP</button>
                        <button class="close-btn" @click="$emit('close-otpverify')">Close</button>
                    </div>
                </div>
            </div>
            <div class="buttons" v-show="remainingTime > 0">
                <button class="close-btn" @click="$emit('close-otpverify')">Close</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
.close-btn:hover {
    background: #8f3434 !important;
}
</style>