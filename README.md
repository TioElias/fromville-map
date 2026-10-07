# MiniMax H3 pruned — Kaggle

Importe `minimax_h3_pruned_kaggle.ipynb` no Kaggle. Em Settings, habilite GPU e Internet. Anexe uma imagem como Dataset, preencha `REFERENCE_IMAGES` na primeira célula e execute as células em ordem.

O notebook usa o **REF2VA pruned INT8 oficial**, compatível com o tipo de referências do workflow, em uma passagem. Começa com 608 × 352 e um clipe curto para testar memória; depois use o perfil `qualidade`. Não usa DualClock/SageAttention personalizados nem upscale. O JSON original é mantido como referência.

## Modelos

Preferencialmente anexe os pesos de [Comfy-Org/MiniMax-H3](https://huggingface.co/Comfy-Org/MiniMax-H3) como Dataset. Os nomes e diretórios estão na célula 5. O conjunto chega perto de **42 GB**: o notebook usa links para `/kaggle/input`, verifica os arquivos e bloqueia downloads quando falta espaço.

A LoRA People é opcional: anexe seu arquivo e preencha `PEOPLE_LORA_PATH`. A LoRA turbo REF2V de 4 passos é usada só no perfil inicial; os perfis conservador/qualidade usam 20 passos do modelo base. Outras LoRAs de velocidade precisam de arquivo local e passos explícitos.

## Limites e validação

Duas T4 não somam VRAM automaticamente. Pruned ainda exige um encoder Qwen3-VL 32B; T4/P100 não têm FP4 nativo. O modo padrão usa carregamento dinâmico apoiado em disco, VAE na CPU e decode em tiles, mas isso **não garante** que H3 caiba em toda sessão Kaggle.

Validação local: formato do notebook, sintaxe Python, grade de frames, bloqueio de download por espaço, roteamento de LoRAs e validação do grafo pelos nós nativos do ComfyUI. A inferência completa e a qualidade da pele não foram testadas aqui: dependem de GPU e pesos no Kaggle.

Os vídeos são exibidos no notebook e salvos em `/kaggle/working/minimax_h3/output`. O servidor é local, sem túnel público. Nenhum modelo, token ou resultado gerado deve ser enviado ao Git.

A instalação recupera falhas de `venv`/`ensurepip` com `virtualenv`, inclusive quando a tentativa anterior deixou um ambiente parcial.
