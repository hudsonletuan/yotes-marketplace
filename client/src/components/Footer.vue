<template>
    <div class="footer">
        <div>
            <p>&copy; 2024 - All rights reserved</p>
        </div>
        <div>
            <p>Please report any issues to: <a href="mailto:tuan.le@yotes.collegeofidaho.edu">tuan.le@yotes.collegeofidaho.edu</a></p>
        </div>
    </div>
</template>

<style scoped>
.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 30px;
    background-color: #333;
    color: white;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    font-size: 16px;
}

@media screen and (max-width: 760px) {
    .footer {
        font-size: 14px;
    }

}
@media screen and (max-width: 670px) {
    .footer {
        font-size: 12px;
    }
}
@media screen and (max-width: 580px) {
    .footer {
        display: flex;
        flex-direction: column;
        font-size: 8px;
    }
}

</style>