<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import Compressor from 'compressorjs';
import heic2any from 'heic2any';

const emit = defineEmits(['close-newpost', 'post-created']);
const closeNewPost = () => {
    emit('close-newpost');
};
const username = computed(() => localStorage.getItem('username'));
const userImg = computed(() => localStorage.getItem('userImg'));
const userId = computed(() => localStorage.getItem('userId'));

const selectedMedia = ref<File[]>([]);
const objectURLs = ref<string[]>([]);
const hoverIndex = ref(-1);
const topic = ref('');
const caption = ref('');
const location = ref('');
const price = ref<number | null>(null);
const showStatus = ref(false);
const selectedStatus = ref('Available');

const uploadingImages = ref(false);
const handleMediaChange = async (event: Event) => {
    uploadingImages.value = true;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const newFiles = Array.from((event.target as HTMLInputElement).files as FileList);
    if (!newFiles.length){
        uploadingImages.value = true;
        return;
    };
    const validFiles = newFiles.filter((file) => {
        const isValidType = (file.type.startsWith('image/') && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(file.type.split('/')[1])) || 
        (file.type.startsWith('video/') && ['mp4'].includes(file.type.split('/')[1]));
        return isValidType && file.size <= MAX_FILE_SIZE;
    });
    const heicFiles = newFiles.filter((file) => file.name.toLocaleLowerCase().endsWith('.heic') || file.name.toLocaleLowerCase().endsWith('.heif'));
    const invalidFiles = newFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length) {
        alert(`The following files exceed the maximum file size of 5MB: ${invalidFiles.map((file) => file.name).join(', ')}`);
    }
    if (!validFiles.length && !heicFiles.length) {
        uploadingImages.value = false;
        alert('Invalid file(s) selected. Only jpg, jpeg, png, heic/heif, and mp4 are supported.')
        return;
    };
    if (heicFiles.length > 0) {
        const conversionPromises = heicFiles.map((file) => {
            return heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.3,
            })
            .then((convertedBlob) => {
                const convertedFile = new File([convertedBlob as BlobPart], file.name.replace(/\.heic$|\.heif$/i, '.jpeg'), { type: 'image/jpeg' });
                selectedMedia.value.push(convertedFile);
                const objectURL = URL.createObjectURL(convertedFile);
                objectURLs.value.push(objectURL);
            })
            .catch((error) => {
                console.error(error);
            });
        });
        await Promise.all(conversionPromises);
    }
    validFiles.forEach((file) => {
        if (file.type.startsWith('video/')) {
            const objectURL = URL.createObjectURL(file);
            objectURLs.value.push(objectURL);
            selectedMedia.value.push(file);
        } else {
            new Compressor(file, {
                quality: 0.3,
                success(result) {
                    const compressedFiles = new File([result], file.name, { type: file.type });
                    selectedMedia.value.push(compressedFiles);
                    const objectURL = URL.createObjectURL(compressedFiles);
                    objectURLs.value.push(objectURL);
                },
                error(error) {
                    console.error(error.message);
                },
            });
        }
    });

    // selectedMedia.value = [...selectedMedia.value, ...compressedFiles];

    // validFiles.forEach((file) => {
    //     const objectURL = URL.createObjectURL(file);
    //     objectURLs.value.push(objectURL);
    // });
    uploadingImages.value = false;
};

const getObjectURL = (index: number) => objectURLs.value[index];

const removeMedia = (index: number) => {
    selectedMedia.value.splice(index, 1);
    const objectURL = objectURLs.value.splice(index, 1)[0];
    URL.revokeObjectURL(objectURL);
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

const uploading = ref(false);

const postNewPost = async () => {
    const formData = new FormData();
    formData.append('userId', userId.value ? userId.value : '');
    formData.append('username', username.value ? username.value : 'Anonymous');
    formData.append('userImg', userImg.value ? userImg.value : "https://marketplace.tuanle.top/yotes-logo.png");
    formData.append('caption', caption.value);
    formData.append('status', selectedStatus.value);
    formData.append('price', price.value?.toString() || '');
    formData.append('location', location.value);

    if (caption.value.split(' ').length < 5) {
        alert('Caption must be at least 5 words');
        return;
    }
    if (topic.value.split(' ').length > 10) {
        alert('Topic must be less than 10 words');
        return;
    }

    if (topic.value && topic.value.split(' ').length <= 50) {
        formData.append('topic', topic.value);
    }
    
    selectedMedia.value.forEach((file) => {
        formData.append('media', file);
    });

    const totalMediaFiles = selectedMedia.value.length;
    if (totalMediaFiles > 10) {
        alert('You can only upload up to 10 media files');
        return;
    }

    uploading.value = true;
    try {
        const response = await axios.post('/api/newpost', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        // alert('Post created successfully!');
        emit('post-created');
        window.location.reload();
    } catch (error) {
        console.error(error);
    }
};
</script>

<template>
    <div class="new-post-backdrop" @click="closeNewPost">
        <div class="new-post-container" @click.stop>
            <div v-if="uploading" class="uploading">
                <div class="loader"></div>
                <div class="loader2"></div>
            </div>
            <div v-show="uploadingImages" class="uploadingImages">
                <div class="loaderImage"></div>
                <div class="loaderImage2"></div>
            </div>
            <div class="topic-input">
                <input type="text" placeholder="Topic (Less than 10 words)" v-model="topic" />
            </div>
            <div class="caption-input">
                <textarea placeholder="Write a caption..." v-model="caption" />
            </div>
            <div class="media-preview">
                <button class="nav-btn" @click="scrollMedia(-1)" :disabled="!selectedMedia.length || ($refs.mediaItems as HTMLDivElement).scrollLeft <= 0">&#10094;</button>
                <div class="media-items" ref="mediaItems">
                    <div v-for="(file, index) in selectedMedia" :key="`${index}-${file.lastModified}`" class="media-item-wrapper" @mouseover="hoverIndex = index" @mouseleave="hoverIndex = -1">
                        <div class="media-item">
                            <img v-if="(file as File).type.startsWith('image/')" :src="getObjectURL(index)" alt="Preview" />
                            <video v-else-if="file.type.startsWith('video/')" controls>
                                <source :src="getObjectURL(index)" :type="file.type">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <button class="remove-btn" @click="removeMedia(index)" :class="hoverIndex === index ? 'visible' : 'hidden'">&#10006;</button>
                    </div>
                </div>
                <button class="nav-btn" @click="scrollMedia(1)" :disabled="!selectedMedia.length || ($refs.mediaItems as HTMLElement).scrollLeft >= ($refs.mediaItems as HTMLElement).scrollWidth - ($refs.mediaItems as HTMLElement).clientWidth">&#10095;</button>
            </div>
            <div class="buttons">
                <div class="sub-buttons-add">
                    <label class="btn label-add-media" for="media-upload">Add Media</label>
                    <input type="file" accept="image/*, video/mp4" id="media-upload" multiple style="display: none" @change="handleMediaChange" />
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
                    <button class="btn btn-close" @click="closeNewPost">Discard</button>
                    <div v-if="caption.trim().length > 0 && topic.trim().length > 0">
                        <button class="btn btn-post" @click="postNewPost">Post</button>
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
.new-post-container {
    width: 600px;
}
.uploading {
    display: flex;
    gap: 10px;
}
/* HTML: <div class="loader"></div> */
.loader {
    width: 120px;
    height: 22px;
    border-radius: 40px;
    color: #514b82;
    border: 2px solid;
    position: relative;
    overflow: hidden;
}
.loader::before {
    content: "";
    position: absolute;
    margin: 2px;
    width: 14px;
    top: 0;
    bottom: 0;
    left: -20px;
    border-radius: inherit;
    background: currentColor;
    box-shadow: -10px 0 12px 3px currentColor;
    clip-path: polygon(0 5%, 100% 0,100% 100%,0 95%,-30px 50%);
    animation: l14 1s infinite linear;
}
@keyframes l14 {
    100% {left: calc(100% + 20px)}
}

/* HTML: <div class="loader2"></div> */
.loader2 {
    width: fit-content;
    font-weight: bold;
    background:linear-gradient(90deg,#514b82 50%,#0000 0) right/200% 100%;
    animation: l21 2s infinite linear;
}
.loader2::before {
    content :"Uploading...";
    color: #0000;
    padding: 0 5px;
    background: inherit;
    background-image: linear-gradient(90deg,#fff 50%,#000 0);
    -webkit-background-clip:text;
            background-clip:text;
}

@keyframes l21{
    100%{background-position: left}
}

.uploadingImages {
    display: flex;
    align-items: center;
    gap: 10px;
}
/* HTML: <div class="loader"></div> */
.loaderImage {
    width: 120px;
    height: 20px;
    border-radius: 20px;
    background:
    repeating-linear-gradient(135deg,#f03355 0 10px,#ffa516 0 20px) 0/0%   no-repeat,
    repeating-linear-gradient(135deg,#ddd    0 10px,#eee    0 20px) 0/100%;
    animation: l3 2s infinite;
}
@keyframes l3 {
    100% {background-size:100%}
}
/* HTML: <div class="loader"></div> */
.loaderImage2 {
    width: fit-content;
    font-weight: bold;
    padding-bottom: 8px;
    color: black;
    background: linear-gradient(black 0 0) 0 100%/0% 3px no-repeat;
    animation: l2 2s linear infinite;
}
.loaderImage2:before {
    content:"Loading media files..."
}
@keyframes l2 {to{background-size: 100% 3px}}

.topic-input input {
    width: 100%;
    padding: 10px;
    font-size: 18px;
    font-weight: bold;
    border: none;
    border-bottom: 1px solid #ccc;
    margin-bottom: 10px;
    outline: none;
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