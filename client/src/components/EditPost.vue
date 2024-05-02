<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close-editpost', 'post-edited']);
const closeEditPost = () => {
    emit('close-editpost');
};
const username = computed(() => localStorage.getItem('username'));
const userImg = computed(() => localStorage.getItem('userImg'));
const userId = computed(() => localStorage.getItem('userId'));

const props = defineProps<{
    post: {
        _id: string;
        username: string;
        userImg: string;
        caption: string;
        status: string;
        price: number;
        location: string;
        uploaded: { media: string }[];
    };
}>();

const selectedMedia = ref<File[]>([]);
const existingMedia = ref<string[]>([]);
const objectURLs = ref<string[]>([]);
const hoverIndex = ref(-1);
const caption = ref('');
const location = ref('');
const price = ref<number | null>(null);
const showStatus = ref(false);
const selectedStatus = ref('Available');
const existingMediaUrls: string[] = props.post.uploaded.map((media: { media: string }) => media.media);

const handleMediaChange = (event: Event) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const newFiles = Array.from((event.target as HTMLInputElement).files as FileList);
    const validFiles = newFiles.filter((file) => file.size <= MAX_FILE_SIZE);

    selectedMedia.value = [...selectedMedia.value, ...validFiles];

    validFiles.forEach((file) => {
        const objectURL = URL.createObjectURL(file);
        objectURLs.value.push(objectURL);
    });

    const invalidFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length) {
        alert(`The following files exceed the maximum file size of 5MB: ${invalidFiles.map((file) => file.name).join(', ')}`);
    }
};

const getObjectURL = (index: number) => objectURLs.value[index];

const mediaKey = ref(0);

const removeMedia = (file: File | string) => {
    const scrollLeft = (mediaItems.value as HTMLElement).scrollLeft;

    const index = selectedMedia.value.findIndex((f) => f === file)
    if (index !== -1) {
        selectedMedia.value.splice(index, 1);
        objectURLs.value.splice(index + existingMedia.value.length, 1);
    } else {
        const index = existingMedia.value.findIndex((f) => f === file)
        if (index !== -1) {
        existingMedia.value.splice(index, 1);
        objectURLs.value.splice(index, 1);
        existingMediaUrls.splice(index, 1);
        }
    }

    nextTick(() => {
        const container = mediaItems.value as HTMLElement;
        container.scrollTo({
            left: scrollLeft,
            behavior: 'instant'
        });
    });

    mediaKey.value += 1;
};

const mediaItems = ref<HTMLDivElement | null>(null);

const scrollMedia = (direction: number) => {
    if (mediaItems.value) {
        const scrollAmount = mediaItems.value.scrollLeft + direction * 220;
        mediaItems.value.scrollTo({
            left: scrollAmount,
            behavior: 'smooth',
        });
    }
};

const selectStatus = (status: string) => {
    selectedStatus.value = status;
    showStatus.value = false;
};

const formattedPrice = computed({
    get() {
        return price.value !== null ? `$${price.value}` : '';
    },
    set(value) {
        const numberValue = parseFloat(value.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numberValue)) {
            price.value = numberValue;
        } else {
            price.value = null;
        }
    },
});

const handleKeyPress = (event: KeyboardEvent) => {
    const keyCode = event.keyCode || event.which;
    const keyValue = String.fromCharCode(keyCode);

    const allowedKeys = /[0-9.]|Backspace|Delete|Tab|ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End/.test(keyValue);
    const dotExists = formattedPrice.value.includes('.');
    const isDot = keyValue === '.';
    const isDotAllowed = !dotExists && isDot;

    if (!allowedKeys || (!isDotAllowed && isDot)) {
        event.preventDefault();
    }
};

const hasChanges = computed(() => {
    return (
        caption.value !== props.post.caption ||
        location.value !== props.post.location ||
        price.value !== props.post.price ||
        selectedStatus.value !== props.post.status ||
        JSON.stringify(existingMediaUrls) !== JSON.stringify(props.post.uploaded.map((media) => media.media)) ||
        selectedMedia.value.length > 0
    );
});

const postEditPost = async () => {
    const formData = new FormData();
    formData.append('userId', userId.value ? userId.value : '');
    formData.append('_id', props.post._id);
    formData.append('username', props.post.username);
    formData.append('userImg', props.post.userImg);
    formData.append('caption', caption.value);
    formData.append('status', selectedStatus.value);
    formData.append('price', price.value?.toString() || '');
    formData.append('location', location.value);
    formData.append('existingMediaUrls', JSON.stringify(existingMediaUrls));

    const newMedia = selectedMedia.value.filter((file) => {
        const fileName = file.name; // Extract the file name from the file object
        return !existingMedia.value.includes(fileName);
    });

    newMedia.forEach((file) => {
        formData.append('media', file);
    });

    try {
        const response = await axios.put(`/api/editpost/${props.post._id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const updatedPost = response.data.post;
        existingMedia.value = updatedPost.versions[updatedPost.versions.length - 1].uploaded.map((media: { media: string }) => media.media);
        selectedMedia.value = [];

        alert('Post edited successfully!');
        emit('post-edited');
        window.location.reload();
    } catch (error) {
        console.error(error);
    }
};

const fileMap = new Map<string | File, boolean>();

function isFile(file: string | File): file is File {
    if (fileMap.has(file)) {
        return fileMap.get(file) as boolean;
    }

    const result = file instanceof File;
    fileMap.set(file, result);
    return result;
}

function getMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes = {
        jpg: 'image/jpg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        flv: 'video/x-flv',
    };
    return mimeTypes[extension as keyof typeof mimeTypes] || 'application/octet-stream';
}

const isImage = (fileUrl: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(fileExtension || '');
};

const isVideo = (fileUrl: string): boolean => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'flv'];
    const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(fileExtension || '');
};

onMounted(() => {
    caption.value = props.post.caption;
    location.value = props.post.location;
    price.value = props.post.price;
    selectedStatus.value = props.post.status;

    props.post.uploaded.forEach((file) => {
        const objectURL = file.media;
        objectURLs.value.push(objectURL);
        existingMedia.value.push(objectURL);
    });
});
</script>

<template>
    <div class="edit-post-backdrop" @click="closeEditPost">
        <div class="edit-post-container" @click.stop>
            <div class="caption-input">
                <textarea placeholder="Write a caption..." v-model="caption" />
            </div>
            <div class="media-preview">
                <button class="nav-btn" @click="scrollMedia(-1)" :disabled="![...existingMedia, ...selectedMedia].length || ($refs.mediaItems as HTMLDivElement).scrollLeft <= 0">&#10094;</button>
                <div class="media-items" ref="mediaItems" :key="mediaKey">
                    <div v-for="(file, index) in [...existingMedia, ...selectedMedia]" :key="index" class="media-item-wrapper" @mouseover="hoverIndex = index" @mouseleave="hoverIndex = -1">
                        <div class="media-item">
                            <img v-if="isFile(file) && file.type.startsWith('image/')" :src="getObjectURL(index)" alt="Preview" />
                            <video v-else-if="isFile(file) && file.type.startsWith('video/')" controls>
                                <source :src="getObjectURL(index)" :type="file.type">
                                Your browser does not support the video tag.
                            </video>
                            <img v-else-if="typeof file === 'string' && isImage(file)" :src="file" alt="Preview" />
                            <video v-else-if="typeof file === 'string' && isVideo(file)" controls>
                                <source :src="file" :type="getMimeType(file)">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <button class="remove-btn" @click="removeMedia(file)" :class="hoverIndex === index ? 'visible' : 'hidden'">&#10006;</button>
                    </div>
                </div>
                <button class="nav-btn" @click="scrollMedia(1)" :disabled="![...existingMedia, ...selectedMedia].length || ($refs.mediaItems as HTMLElement).scrollLeft >= ($refs.mediaItems as HTMLElement).scrollWidth - ($refs.mediaItems as HTMLElement).clientWidth">&#10095;</button>
            </div>
            <div class="buttons">
                <div class="sub-buttons-add">
                    <label class="btn label-add-media" for="media-upload">Add Media</label>
                    <input type="file" accept="image/*, video/*" id="media-upload" multiple style="display: none" @change="handleMediaChange" />
                    <input class="add-location" type="text" placeholder="Add Location" v-model="location" />
                    <div class="dropdown-container">
                        <button class="btn btn-status" @click="showStatus = !showStatus"><span v-if="selectedStatus">{{ selectedStatus }}</span></button>
                        <ul v-if="showStatus" class="dropdown">
                            <li @click="selectStatus('Available')">Available</li>
                            <li @click="selectStatus('Sold')">Sold</li>
                            <li @click="selectStatus('Not Available')">Not Available</li>
                            <li @click="selectStatus('Looking For...')">Looking For...</li>
                        </ul>
                    </div>
                    <input class="price" type="text" inputmode="decimal" v-model="formattedPrice" @keypress="handleKeyPress" placeholder="Price" />
                </div>
                <div class="sub-buttons-finish">
                    <button class="btn btn-close" @click="closeEditPost">Discard</button>
                    <div v-if="hasChanges">
                        <button class="btn btn-post" @click="postEditPost">Post</button>
                    </div>
                    <div v-else>
                        <button class="btn btn-post" style="background-color: #5dabff;" disabled>Post</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap');
* {
    font-family: 'Open Sans', sans-serif;
    box-sizing: border-box;
}
.edit-post-container {
    width: 600px;
}
.caption-input textarea {
    width: 100%;
    height: 7em;
    font-size: 16px;
    border: none;
    overflow: auto;
    outline: none;
    padding: 0 5px;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;

    resize: none;
}
.caption-input textarea:focus {
    outline: none;
}
.media-preview {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}
.media-preview img, .media-preview video {
    height: 200px;
    border-radius: 10px;
    object-fit: contain;
}
.media-item {
    position: relative;
    display: inline-block;
    overflow: hidden;
    border-radius: 10px;
    min-height: 200px;
}
.media-item-wrapper {
    position: relative;
}
.media-item-wrapper:hover::before {
    opacity: 1;
}
.remove-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    border: none;
    color: white;
    cursor: pointer;
    padding: 5px;
    font-size: 14px;
    background-color: rgba(148, 148, 148, 0.5);
    border-radius: 50%;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
}

.visible {
    opacity: 1;
    visibility: visible;
}

.hidden {
    opacity: 0;
    visibility: hidden;
}
.media-preview:hover .nav-btn {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease, visibility 0.3s ease;
    background-color: rgba(82, 82, 82, 0.5);
}
.nav-btn {
    position: absolute;
    top: 45%;
    transform: translateY(-50%);
    background-color: transparent;
    border: none;
    padding: 10px;
    cursor: pointer;
    z-index: 1;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease, visibility 0.3s ease, background-color 0.3s ease;
    color: black;
}
.nav-btn:hover {
    background-color: rgba(190, 190, 190, 0.5) !important;
    transition: background-color 0.3s ease !important;
}
.nav-btn:first-child {
    left: 0;
}

.nav-btn:last-child {
    right: 0;
}
.media-items {
    display: flex;
    overflow-x: auto;
    scroll-behavior: smooth;
    gap: 10px;
}
.sub-buttons-add, .sub-buttons-finish {
    display: flex;
    align-items: center;
}
.sub-buttons-finish button {
    font-weight: bold;
    transition: .2s ease-in-out;
}
.sub-buttons-add label, .btn-status span, .price {
    font-weight: bold;
}
.price:placeholder-shown {
    font-weight: normal;
}
.dropdown {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    color: black;
    border-radius: 5px;
    list-style: none;
    margin: 5px 0 0 0;
    padding: 0;
    z-index: 1;
}
.dropdown li {
    padding: 5px 10px;
    cursor: pointer;
}
.dropdown li:hover {
    background-color: #bdbdbd;
}
.add-location {
    width: 120px;
    padding: 8px;
    border-radius: 5px;
    border: 2px solid #6c6c6c;
}
.price {
    width: 80px;
    padding: 8px;
    border-radius: 5px;
    border: 2px solid #6c6c6c;
}
.buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    gap: 20px;
}
.btn {
    padding: 10px;
    border-radius: 10px;
    border: none;
    color: white;
    cursor: pointer;
    margin: 0 5px;
    font-size: 14px;
    transition: .2s ease-in-out;
}
.btn:hover {
    transition: .2s ease-in-out;
}
.label-add-media {
    background-color: #28a745;
}
.label-add-media:hover {
    background-color: #218639;
}
.btn-add-location {
    background-color: #ea8b1e;
}
.btn-status {
    background-color: #ff0099;
}
.btn-status:hover {
    background-color: #ba0070;
}
.btn-close {
    background-color: red;
}
.btn-close:hover {
    background-color: #cd0000;
}
.btn-post {
    background-color: #007bff;
}
.btn-post:hover {
    background-color: #0066d2;
}
</style>