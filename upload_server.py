"""
文件上传服务器
运行方式: python upload_server.py
默认端口: 8888
上传目录: download_file/
"""
import os
import sys
import json
import cgi
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# 切换到脚本所在目录，确保静态文件服务正确
SCRIPT_DIR = Path(__file__).parent.resolve()
os.chdir(str(SCRIPT_DIR))

UPLOAD_DIR = SCRIPT_DIR / 'download_file'
UPLOAD_DIR.mkdir(exist_ok=True)


class UploadHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path != '/upload':
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
            return

        try:
            content_type = self.headers.get('Content-Type', '')
            if 'multipart/form-data' not in content_type:
                self._json_response(400, {'success': False, 'message': '请求格式错误，需要 multipart/form-data'})
                return

            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    'REQUEST_METHOD': 'POST',
                    'CONTENT_TYPE': content_type,
                }
            )

            if 'file' not in form:
                self._json_response(400, {'success': False, 'message': '没有找到上传的文件'})
                return

            file_item = form['file']
            if not file_item.filename:
                self._json_response(400, {'success': False, 'message': '没有选择文件'})
                return

            original_name = os.path.basename(file_item.filename)
            safe_name = "".join(c for c in original_name if c not in r'\/:*?"<>|')
            safe_name = safe_name.strip()
            if not safe_name:
                safe_name = 'uploaded_file'

            target_path = UPLOAD_DIR / safe_name

            with open(target_path, 'wb') as f:
                f.write(file_item.file.read())

            print(f'[上传成功] {safe_name}')
            self._json_response(200, {
                'success': True,
                'message': '文件上传成功',
                'filename': safe_name
            })

        except Exception as e:
            print(f'[上传失败] {e}')
            import traceback
            traceback.print_exc()
            self._json_response(500, {'success': False, 'message': f'服务器错误: {str(e)}'})

    def _json_response(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
    server = HTTPServer(('0.0.0.0', port), UploadHandler)
    print(f'上传服务器已启动: http://localhost:{port}')
    print(f'上传接口: POST /upload')
    print(f'静态文件根目录: {SCRIPT_DIR}')
    print(f'保存目录: {UPLOAD_DIR}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()
