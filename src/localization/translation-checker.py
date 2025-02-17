#!/usr/bin/env python3
import json
from pathlib import Path
from typing import Dict, Any
from copy import deepcopy

def get_nested_dict(d: Dict, path: str) -> Dict:
    result = {}
    current = result
    parts = path.split('.')
    for part in parts[:-1]:
        current[part] = {}
        current = current[part]
    current[parts[-1]] = d
    return result

def merge_dicts(d1: Dict, d2: Dict) -> Dict:
    result = deepcopy(d1)
    for k, v in d2.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = merge_dicts(result[k], v)
        else:
            result[k] = v
    return result

def get_keys(d: Dict, prefix: str = '') -> set:
    keys = set()
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        keys.add(full_key)
        if isinstance(v, dict):
            keys.update(get_keys(v, full_key))
    return keys

def get_nested_value(d: Dict, path: str) -> Any:
    current = d
    for key in path.split('.'):
        current = current[key]
    return current

def update_translations(reference_file: str, translation_file: str) -> None:
    with open(reference_file, 'r', encoding='utf-8') as f:
        reference_json = json.load(f)
    
    with open(translation_file, 'r', encoding='utf-8') as f:
        translation_json = json.load(f)

    reference_keys = get_keys(reference_json)
    translation_keys = get_keys(translation_json)

    result = {}
    for key in reference_keys:
        if key in translation_keys:
            nested = get_nested_dict(get_nested_value(translation_json, key), key)
            result = merge_dicts(result, nested)
        else:
            nested = get_nested_dict("<TRANSLATE THIS>", key)
            result = merge_dicts(result, nested)

    output_file = Path(translation_file).stem + '_updated.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python script.py reference.json translation.json")
        sys.exit(1)
    
    update_translations(sys.argv[1], sys.argv[2])