<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close-newpost', 'post-created']);
const closeNewPost = () => {
    emit('close-newpost');
};

const selectedMedia = ref([]);
const objectURLs = ref<string[]>([]);
const hoverIndex = ref(-1);
const caption = ref('');
const location = ref('');
const price = ref<number | null>(null);
const showStatus = ref(false);
const selectedStatus = ref('Available');

const handleMediaChange = (event) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const newFiles = Array.from(event.target.files);
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

const getObjectURL = (index) => objectURLs.value[index];

const removeMedia = (index) => {
    selectedMedia.value.splice(index, 1);
    const objectURL = objectURLs.value.splice(index, 1)[0];
    URL.revokeObjectURL(objectURL);
};

const mediaItems = ref<HTMLDivElement | null>(null);

const scrollMedia = (direction) => {
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

const postNewPost = async () => {
    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('caption', caption.value);
    formData.append('status', selectedStatus.value);
    formData.append('price', price.value?.toString() || '');
    formData.append('location', location.value);
    
    selectedMedia.value.forEach((file) => {
        formData.append('media', file);
    });
    try {
        const response = await axios.post('/api/newpost', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        alert('Post created successfully!');
        emit('post-created');
    } catch (error) {
        console.error(error);
    }
};
</script>

<template>
    <div class="new-post-backdrop" @click="closeNewPost">
        <div class="new-post-container" @click.stop>
            <div class="caption-input">
                <textarea placeholder="Write a caption..." v-model="caption" />
            </div>
            <div class="media-preview">
                <button class="nav-btn" @click="scrollMedia(-1)" :disabled="!selectedMedia.length || mediaItems.value?.scrollLeft <= 0">&#10094;</button>
                <div class="media-items" ref="mediaItems">
                    <div v-for="(file, index) in selectedMedia" :key="`${index}-${file.lastModified}`" class="media-item-wrapper" @mouseover="hoverIndex = index" @mouseleave="hoverIndex = -1">
                        <div class="media-item">
                            <img v-if="file.type.startsWith('image/')" :src="getObjectURL(index)" alt="Preview" />
                            <video v-else-if="file.type.startsWith('video/')" controls>
                                <source :src="getObjectURL(index)" :type="file.type">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <button class="remove-btn" @click="removeMedia(index)" :class="hoverIndex === index ? 'visible' : 'hidden'">&#10006;</button>
                    </div>
                </div>
                <button class="nav-btn" @click="scrollMedia(1)" :disabled="!selectedMedia.length || mediaItems.value?.scrollLeft >= mediaItems.value?.scrollWidth - mediaItems.value?.clientWidth">&#10095;</button>
            </div>
            <div class="buttons">
                <div class="sub-buttons-add">
                    <label class="btn label-add-media" for="media-upload">Add Media</label>
                    <input type="file" accept="image/*, video/*" id="media-upload" multiple="multiple" style="display: none" @change="handleMediaChange" />
                    <input class="add-location" type="text" placeholder="Add Locaiton" v-model="location" />
                    <div class="dropdown-container">
                        <button class="btn btn-status" @click="showStatus = !showStatus"><span v-if="selectedStatus">{{ selectedStatus }}</span></button>
                        <ul v-if="showStatus" class="dropdown">
                            <li @click="selectStatus('Available')">Available</li>
                            <li @click="selectStatus('Sold')">Sold</li>
                            <li @click="selectStatus('Not Available')">Not Available</li>
                        </ul>
                    </div>
                    <input class="price" type="text" inputmode="decimal" v-model="formattedPrice" @keypress="handleKeyPress" placeholder="Price" />
                </div>
                <div class="sub-buttons-finish">
                    <button class="btn btn-close" @click="closeNewPost">Discard</button>
                    <button class="btn btn-post" @click="postNewPost">Post</button>
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
    width: 200px;
    border-radius: 10px;
    object-fit: cover;
}
.media-item-wrapper {
    position: relative;
    display: inline-block;
    overflow: hidden;
    border-radius: 10px;
    min-width: 220px;
}
.media-item-wrapper:hover::before {
    opacity: 1;
}
.remove-btn {
    position: absolute;
    top: 5px;
    right: 25px;
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
}
.nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: transparent;
    border: none;
    padding: 10px;
    cursor: pointer;
    z-index: 1;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease, visibility 0.3s ease, background-color 0.3s ease;
}
.nav-btn:hover {
    background-color: rgba(0, 0, 0, 0.5);
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
}
.sub-buttons-add {
    display: flex;
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
    width: 100px;
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
}
.btn:hover {
    transition: .2s ease-in-out;
}
.label-add-media {
    background-color: #28a745;
}
.btn-add-location {
    background-color: #ea8b1e;
}
.btn-status {
    background-color: #ff0099;
}
.btn-close {
    background-color: red;
}
.btn-post {
    background-color: #007bff;
}

</style>