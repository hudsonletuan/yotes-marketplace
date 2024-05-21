<script setup lang="ts">
const userId = localStorage.getItem('userId');
</script>
<template>
    <div class="footer">
        <div v-if="!userId" @click="$emit('open-instruction')" class="instruction">
            <p>Instruction</p>
        </div>
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
.instruction {
    background-color: hsla(160, 100%, 37%, 1);
    padding: 0rem .5rem;
    border-radius: 1rem;
    cursor: pointer;
    transition: background-color .2s ease;
}
.instruction:hover {
    background-color: hsla(160, 100%, 35%, 0.8);
    transition: background-color .2s ease;
}

@media screen and (max-width: 830px) {
    .footer {
        font-size: 14px;
        flex-direction: column;
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