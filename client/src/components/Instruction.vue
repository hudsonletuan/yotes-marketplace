<template>
    <div class="instruction-container">
        <div class="instruction-header">
            <h1>Instructions</h1>
            <button @click="$emit('close-instruction')">Close</button>
        </div>
        <p>1.	Click Login/Signup at the top right corner and choose Sign up to create your new account.</p>
        <img src="https://marketplace.tuanle.top/loginsignupbtn.png" alt="" />
        <p>2.	Enter your preferred username, email, and password, then click Sign Up to proceed.</p>
        <ul>
            <li>You must use your school email to get your verification code.</li>
            <li>Your username must be from 6-12 characters.</li>
            <li>Your password must be at least 6 characters.</li>
        </ul>
        <img src="https://marketplace.tuanle.top/signup.png" alt="" />
        <p>3.	A one-time passcode (OTP) will be sent to your email (check your junk/spam box if you do not see it). Type or copy the code into the boxes and you will be automatically logged in.</p>
        <img src="https://marketplace.tuanle.top/otp.png" alt="" />
        <p>4.	Click (+ New Post) at the top of your screen (or (+) if you are using a mobile phone) to create a new post.</p>
        <img src="https://marketplace.tuanle.top/newpost.png" alt="" />
        <p>5.	Fill out a short topic, and a caption, and add some photos/videos if you would like to. Add a location where you want people to come. Choose the status of your items, if you are just looking for something, you can put “Looking For…”. Add a price that your items cost or you are willing to pay for your looking-for items, if you leave it blank or $0, it would be “Free”. Then hit Post. Your post now is live.</p>
        <p>You can always come back to edit the post later.</p>
        <img src="https://marketplace.tuanle.top/postnewpost.png" alt="" />
        <p>6.	Click Post and now your post is live. You can always come back to edit the post later.</p>
        <img src="https://marketplace.tuanle.top/apost.png" alt="" />
        <p>7.	There are options in your posts to edit, delete, or share your posts with other people. You can also share other people’s posts or report any posts that you find inappropriate.</p>
        <div>
            <img style="margin-right: 1rem;" src="https://marketplace.tuanle.top/myoptions.png" alt="" />
            <img src="https://marketplace.tuanle.top/otheroptions.png" alt="" />
        </div>
        <p>8.	If you find some items that you are interested in, you can directly message the post owner by hitting Send Message (or the paper plane if you are using a mobile phone) at the bottom right corner of the post.</p>
        <img src="https://marketplace.tuanle.top/sendmessage.png" alt="" />
        <p>9.	You can view all your chats when clicking on Messages (or the message bubble if you are using a mobile phone).</p>
        <img src="https://marketplace.tuanle.top/messages.png" alt="" />
        <p>10.	You can click on the username of anyone to see all their posts or you can go to the search box at the top of your screen to start searching for what you are interested in.</p>
        <img src="https://marketplace.tuanle.top/searchbox.png" alt="" />
    </div>
</template>

<style scoped>
.instruction-container {
    height: 80vh;
    overflow-y: auto;
    color: white;
    background-color: #212529;
    line-height: 1.8;
}
img {
    border-radius: .5rem;
}
.instruction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}
.instruction-header button {
    font-size: 16px;
    font-weight: bold;
    color: white;
    background-color: transparent;
    height: 2rem;
    border: 2px solid white;
    border-radius: .5rem;
    transition: background-color .2s ease;
    cursor: pointer;
}
.instruction-header button:hover {
    background-color: white;
    color: #212529;
    transition: background-color .2s ease;
}
@media screen and (max-width: 760px) {
    .instruction-container {
        height: 70vh;
        font-size: 12px;
    }
    img {
        max-width: 50%;
    }
    
}
</style>