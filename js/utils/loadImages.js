export class ImageUploader {
  constructor({ dropZoneId, inputId, previewId, maxFiles = 8 }) {
    this.dropZone = document.getElementById(dropZoneId);
    this.input = document.getElementById(inputId);
    this.preview = document.getElementById(previewId);
    this.maxFiles = maxFiles;
    this.files = [];
    this.objectUrls = [];

    if (!this.dropZone || !this.input || !this.preview) {
      throw new Error('ImageUploader: drop zone, input, and preview elements are required');
    }

    this.bindEvents();
  }

  bindEvents() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      this.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    });

    this.dropZone.addEventListener('dragover', () => {
      this.dropZone.classList.add('image-uploader__dropzone--active');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('image-uploader__dropzone--active');
    });

    this.dropZone.addEventListener('drop', (event) => {
      this.dropZone.classList.remove('image-uploader__dropzone--active');
      const files = [...(event.dataTransfer?.files || [])];
      this.addFiles(files);
    });

    this.dropZone.addEventListener('click', (event) => {
      if (event.target.closest('[data-remove-image]')) {
        return;
      }

      this.input.click();
    });

    this.input.addEventListener('change', () => {
      const files = [...(this.input.files || [])];
      this.addFiles(files);
      this.input.value = '';
    });

    this.preview.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-image]');

      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.removeFile(Number(button.dataset.removeImage));
    });
  }

  addFiles(fileList) {
    const imageFiles = fileList.filter((file) => file.type.startsWith('image/'));

    if (!imageFiles.length) {
      return;
    }

    const availableSlots = this.maxFiles - this.files.length;
    const filesToAdd = imageFiles.slice(0, Math.max(0, availableSlots));

    filesToAdd.forEach((file) => {
      this.files.push(file);
    });

    this.render();
  }

  removeFile(index) {
    if (index < 0 || index >= this.files.length) {
      return;
    }

    this.files.splice(index, 1);
    this.render();
  }

  render() {
    this.revokeObjectUrls();

    if (!this.files.length) {
      this.preview.innerHTML = '';
      this.preview.hidden = true;
      return;
    }

    this.preview.hidden = false;
    this.preview.innerHTML = this.files.map((file, index) => {
      const url = URL.createObjectURL(file);
      this.objectUrls.push(url);

      return `
        <article class="image-uploader__item">
          <img class="image-uploader__preview" src="${url}" alt="${file.name}">
          <button class="image-uploader__remove" type="button" data-remove-image="${index}" aria-label="Удалить изображение">×</button>
          <p class="image-uploader__name">${file.name}</p>
        </article>
      `;
    }).join('');
  }

  getSelectedFiles() {
    return [...this.files];
  }

  clear() {
    this.files = [];
    this.input.value = '';
    this.render();
  }

  revokeObjectUrls() {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }
}

export default ImageUploader;
