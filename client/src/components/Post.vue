<template>
    <div class="post-container">
        <div class="post">
            <div class="post-user">
                <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="profile" />
                <h3>username</h3>
                <h5><span>at </span>datetime</h5>
            </div>
            <div class="post-caption">
                <p>CHẮC GÌ BẠN ĐÃ BIẾT
                    <br>Năm 2018, phòng thí nghiệm sức đẩy phản lực (JPL) của NASA bị đánh cắp hơn 500MB dữ liệu nhạy cảm bằng kỹ thuật tấn công rất ối giồi ôi.
                    <br>Hacker phát hiện tổ chức này có điểm yếu là lâu rồi không thực hiện kiểm kê các tài khoản, máy chủ hay những thiết bị kết nối vào mạng. Lợi dụng kẻ hở này, hắn đem theo chiếc Raspberry Pi (máy tính nhỏ xíu bằng cái thẻ ATM) cắm vào mạng. Biến nó trở thành con đường địa đạo để truy cập mạng nội bộ, âm thầm lấy đi các tài liệu nhạy cảm của tổ chức này.</p>
            </div>
            <div class="post-img">
                <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="profile" />
            </div>
        </div>
        <div class="post">
            <div class="post-user">
                <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="profile" />
                <h3>username</h3>
                <h5><span>at </span>datetime</h5>
            </div>
            <div class="post-caption">
                <p>CHẮC GÌ BẠN ĐÃ BIẾT
                    <br>Năm 2018, phòng thí nghiệm sức đẩy phản lực (JPL) của NASA bị đánh cắp hơn 500MB dữ liệu nhạy cảm bằng kỹ thuật tấn công rất ối giồi ôi.
                    <br>Hacker phát hiện tổ chức này có điểm yếu là lâu rồi không thực hiện kiểm kê các tài khoản, máy chủ hay những thiết bị kết nối vào mạng. Lợi dụng kẻ hở này, hắn đem theo chiếc Raspberry Pi (máy tính nhỏ xíu bằng cái thẻ ATM) cắm vào mạng. Biến nó trở thành con đường địa đạo để truy cập mạng nội bộ, âm thầm lấy đi các tài liệu nhạy cảm của tổ chức này.</p>
            </div>
            <div class="post-img">
                <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" alt="profile" />
            </div>
        </div>
    </div>
</template>

<style scoped>
    .post-container {
        overflow: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 80vh;
        width: 100%;
        position: fixed;
        top: 0;
        left: 0;
        margin-top: 80px;
    }
    .post {
        width: 600px;
        border: solid 1px white;
        padding: 10px;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    .post-user {
        display: flex;
        align-items: center;
        flex-direction: row;
        gap: 10px;
    }
    .post-user img {
        width: 30px;
        border-radius: 50%;
    }
    .post-user h3:hover {
        cursor: pointer;
        text-decoration: underline;
    }
    .post-img img {
        width: 100%;
        height: auto;
    }
</style>