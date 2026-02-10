import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    height?: number;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, height = 400, placeholder }: RichTextEditorProps) {
    return (
        <Editor
            apiKey="v0pr5r6jas8tgvj6z52hcgoxpr0xn8rdhay23qjclny6tc5e"
            value={value}
            onEditorChange={onChange}
            init={{
                height: height,
                menubar: true,
                plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                placeholder: placeholder,
                content_style: 'body { font-family:Inter,system-ui,sans-serif; font-size:16px; line-height:1.6 }',
                branding: false,
                promotion: false
            }}
        />
    );
}
