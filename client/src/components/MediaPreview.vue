<script setup lang="ts">
const props = defineProps<{
  mediaSrc: any;
}>();

const isImage = (fileUrl: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'blob'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExtension || '');
};

const isVideo = (fileUrl: string): boolean => {
    const videoExtensions = ['mp4'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(fileExtension || '');
};
</script>

<template>
    <div class="media-preview">
        <div class="media-preview__content">
            <button class="media-preview__close" @click="$emit('close-mediapreview')">
                &#10006;
            </button>
            <img v-if="isImage(mediaSrc)" :src="mediaSrc" alt="Image Preview" />
            <video v-else-if="isVideo(mediaSrc)" :src="mediaSrc" controls autoplay controlslist="nodownload"></video>
        </div>
    </div>
</template>

<style scoped>
.media-preview img, .media-preview video {
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    object-fit: contain;
    margin-top: -0.1rem;
}
.media-preview__close {
    position: absolute;
    border: none;
    color: white;
    cursor: pointer;
    padding: 20px;
    margin: 0.3rem 0.5rem 0.5rem 0.3rem;
    font-size: 25px;
    background-color: rgba(148, 148, 148, 0.5);
    border-radius: 50%;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
    transition: opacity 0.3s ease;
    z-index: 100;
}
.media-preview__close:hover {
    opacity: 1;
    transition: opacity 0.3s ease;
}

@media screen and (max-width: 800px) {
    .media-preview {
        width: 80vw;
    }
    .media-preview img, .media-preview video {
        max-width: 80vw;
    }
    
}
</style>