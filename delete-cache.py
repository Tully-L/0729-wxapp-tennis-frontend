# 示例代码（需根据系统调整路径）
import os
import sqlite3
import shutil
import platform

def get_vscode_db_path():
    system = platform.system()
    if system == "darwin":
        return os.path.expanduser("~/library/application support/code/user/globalstorage/state.vscdb")
    elif system == "windows":
        return os.path.join(os.getenv('appdata'), "code", "user", "globalstorage", "state.vscdb")
    elif system == "linux":
        return os.path.expanduser("~/.config/code/user/globalstorage/state.vscdb")

def clean_vscode_db():
    db_path = get_vscode_db_path()
    if not db_path or not os.path.exists(db_path):
        print("数据库路径错误，请检查VSCode是否安装")
        return
    # 创建备份
    backup_path = f"{db_path}.backup"
    shutil.copy2(db_path, backup_path)
    # 清理数据
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM itemtable WHERE key LIKE '%augment%'")
        conn.commit()