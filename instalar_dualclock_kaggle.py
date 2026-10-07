"""Execute em uma célula do notebook, depois de interromper a célula do servidor."""

import ast
import hashlib
import json
import subprocess
import urllib.request
from pathlib import Path

plugin_revision = "986f8e9ebd4477caa6395eead23d968648cc7a7d"
workflow_sha256 = "49ee5efda4b77e04a1d75cbf155133e78f5409d1fb4ae41757588c5beda32c3d"
comfy_home = Path(globals().get("COMFY_HOME", "/kaggle/temp/h3_r2v_t4x2/ComfyUI"))
if not (comfy_home / "main.py").is_file():
    raise RuntimeError(f"ComfyUI não encontrado em {comfy_home}. Execute na sessão do notebook.")
if (comfy_home.parent / "server.pid").exists():
    raise RuntimeError("Interrompa primeiro somente a célula do servidor ComfyUI e execute esta célula novamente.")

plugin_dir = comfy_home / "custom_nodes" / "ComfyUI-MiniMaxH3DualClockSampler"
if not plugin_dir.exists():
    subprocess.run(
        ["git", "clone", "--no-checkout", "--depth", "1",
         "https://github.com/shuaixn/ComfyUI-MiniMaxH3DualClockSampler.git", str(plugin_dir)],
        check=True,
    )
    subprocess.run(["git", "-C", str(plugin_dir), "fetch", "--depth", "1", "origin", plugin_revision], check=True)
    subprocess.run(["git", "-C", str(plugin_dir), "checkout", "--detach", plugin_revision], check=True)
else:
    result = subprocess.run(["git", "-C", str(plugin_dir), "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
    if result.stdout.strip() != plugin_revision:
        raise RuntimeError("Já existe outra versão do plugin. Ela foi preservada; não será sobrescrita automaticamente.")

# Check the declared node without importing ComfyUI into the notebook kernel.
tree = ast.parse((plugin_dir / "__init__.py").read_text())
mapping_keys = []
for statement in tree.body:
    if isinstance(statement, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "NODE_CLASS_MAPPINGS" for t in statement.targets):
        mapping_keys = [ast.literal_eval(k) for k in statement.value.keys]
if "MiniMaxH3DualClockEulerSampler" not in mapping_keys:
    raise RuntimeError("O plugin instalado não declara o nó esperado.")

workflow_url = "https://raw.githubusercontent.com/TioElias/fromville-map/main/workflow_singularity_dualclock_compativel.json"
with urllib.request.urlopen(workflow_url, timeout=60) as response:
    payload = response.read()
if hashlib.sha256(payload).hexdigest() != workflow_sha256:
    raise RuntimeError("O workflow remoto mudou. Baixe a versão atual deste instalador para manter os arquivos compatíveis.")
workflow = json.loads(payload)
if any(n["type"] == "MiniMaxH3DualClockSamplerT8" for n in workflow["nodes"]):
    raise RuntimeError("O arquivo ainda contém o T8 ausente.")

# Keep the exact case/name of the user's installed Singularity checkpoint.
model_dir = comfy_home / "models" / "diffusion_models"
matches = [p for p in model_dir.rglob("*.safetensors")
           if all(s in p.name.lower() for s in ("singularity", "ref2va", "pruned", "int8", "v1.3"))]
if len(matches) == 1:
    checkpoint = matches[0].relative_to(model_dir).as_posix()
    for node in workflow["nodes"]:
        if node["type"] == "UNETLoader":
            node["widgets_values"][0] = checkpoint
else:
    print("Selecione manualmente o Singularity Pruned já instalado no carregador do modelo.")

wf_dir = comfy_home / "user" / "default" / "workflows"
wf_dir.mkdir(parents=True, exist_ok=True)
output = wf_dir / "singularity_original_dualclock_compativel.json"
if output.exists():
    output = wf_dir / "singularity_original_dualclock_compativel_reimportado.json"
    if output.exists():
        raise RuntimeError("Já há duas cópias desse workflow. Elas foram preservadas; importe o JSON manualmente se necessário.")
output.write_text(json.dumps(workflow, ensure_ascii=False, indent=2), encoding="utf-8")
working = Path("/kaggle/working")
if working.is_dir():
    backup = working / output.name
    if not backup.exists():
        backup.write_bytes(output.read_bytes())

print("Plugin instalado: MiniMaxH3DualClockEulerSampler (shuaixn).")
print("Não substitui automaticamente o nó T8; o workflow adaptado separa o sampler e o scheduler.")
print("Nenhum modelo foi baixado ou removido. Não foi necessário alterar pacotes Python.")
print("Execute novamente somente a célula do servidor e abra o novo link.")
print("Em Workflows, abra:", output.stem)
print("Envie uma imagem no Carregar Imagem ativo e revise o prompt. Perfil inicial: 0.2 MP / 2.3 s / 6 passos.")
