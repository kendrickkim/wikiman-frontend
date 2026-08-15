<template>
  <div class="ckeditor-holder">
    <ckeditor
      v-model="model"
      :editor="ClassicEditor"
      :config="config"
      @ready="onReady"
    />
  </div>
</template>

<script setup>
import { getLocale, useI18n } from '@/i18n'

const { t } = useI18n()
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import {
  Alignment,
  Autoformat,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  Heading,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  Paragraph,
  PasteFromOffice,
  PictureEditing,
  RemoveFormat,
  SourceEditing,
  Strikethrough,
  Table,
  TableToolbar,
  TodoList,
  Underline,
  Undo
} from 'ckeditor5'
import koTranslations from 'ckeditor5/translations/ko.js'
import 'ckeditor5/ckeditor5.css'
import { api, getErrorMessage } from '@/utils/api'

const model = defineModel({ type: String, default: '' })
let editorInstance = null

function onReady(editor) {
  editorInstance = editor
}

function selectedText() {
  if (!editorInstance) return ''
  const selection = editorInstance.model.document.selection
  let text = ''
  for (const range of selection.getRanges()) {
    for (const item of range.getItems()) {
      if (item.is?.('$textProxy')) text += item.data
    }
  }
  return text
}

function insertLink({ href, label }) {
  if (!editorInstance) return
  const selection = editorInstance.model.document.selection
  if (selection.isCollapsed) {
    editorInstance.model.change((writer) => {
      editorInstance.model.insertContent(
        writer.createText(label || href, { linkHref: href }),
        selection.getFirstPosition()
      )
    })
  } else {
    editorInstance.execute('link', href)
  }
  editorInstance.editing.view.focus()
}

defineExpose({ selectedText, insertLink })

class UploadAdapter {
  constructor(loader) {
    this.loader = loader
  }

  async upload() {
    const file = await this.loader.file
    const form = new FormData()
    form.append('image', file)
    try {
      const { data } = await api.post('/uploads', form)
      const url = data.file?.url || data.url
      if (!url) throw new Error(t('remaining.k031'))
      return { default: url }
    } catch (err) {
      throw new Error(getErrorMessage(err, t('remaining.k031')))
    }
  }

  abort() {}
}

function UploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => new UploadAdapter(loader)
}

const editorLocale = getLocale()
const isEnglish = editorLocale.startsWith('en')

const config = {
  licenseKey: 'GPL',
  language: isEnglish ? 'en' : 'ko',
  translations: isEnglish ? [] : [koTranslations],
  placeholder: t('remaining.k032'),
  extraPlugins: [UploadAdapterPlugin],
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Link,
    List,
    TodoList,
    Indent,
    IndentBlock,
    Alignment,
    BlockQuote,
    Code,
    CodeBlock,
    Table,
    TableToolbar,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    ImageResize,
    LinkImage,
    PictureEditing,
    Autoformat,
    PasteFromOffice,
    HorizontalLine,
    Undo,
    SourceEditing,
    RemoveFormat
  ],
  toolbar: {
    shouldNotGroupWhenFull: true,
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'removeFormat',
      '|',
      'link',
      'uploadImage',
      'insertTable',
      'horizontalLine',
      '|',
      'bulletedList',
      'numberedList',
      'todoList',
      '|',
      'outdent',
      'indent',
      'alignment',
      '|',
      'blockQuote',
      'code',
      'codeBlock',
      '|',
      'undo',
      'redo',
      '|',
      'sourceEditing'
    ]
  },
  heading: {
    options: [
      { model: 'paragraph', title: t('remaining.k033'), class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: t('remaining.k034'), class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: t('remaining.k035'), class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: t('remaining.k036'), class: 'ck-heading_heading3' }
    ]
  },
  image: {
    toolbar: [
      'imageTextAlternative',
      'toggleImageCaption',
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
      '|',
      'resizeImage',
      'linkImage'
    ]
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
  }
}
</script>
