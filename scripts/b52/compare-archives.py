"""Inspect ZIP structures/hashes only; never print source contents or dataset."""
import hashlib
import json
import pathlib
import sys
import zipfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inspect(file):
    with zipfile.ZipFile(file) as archive:
        return {item.filename: {
            'sha256': digest(archive.read(item)), 'size': item.file_size,
            'compressed_size': item.compress_size, 'date': item.date_time,
            'mode': item.external_attr >> 16, 'compression': item.compress_type,
        } for item in archive.infolist()}


def compare(left, right):
    a, b = inspect(left), inspect(right)
    common = set(a) & set(b)
    return {
        'left_sha256': digest(left.read_bytes()), 'right_sha256': digest(right.read_bytes()),
        'left_entries': a, 'right_entries': b,
        'added': sorted(set(b) - set(a)), 'removed': sorted(set(a) - set(b)),
        'changed_contents': sorted(k for k in common if a[k]['sha256'] != b[k]['sha256']),
        'compression_only': (set(a) == set(b) and all(a[k]['sha256'] == b[k]['sha256'] for k in a)
                             and left.read_bytes() != right.read_bytes()),
    }


if __name__ == '__main__':
    left, right, output = map(pathlib.Path, sys.argv[1:])
    result = {p.stem: compare(p, right / p.name) for p in sorted(left.glob('*.zip'))}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'compared': len(result), 'compression_only': sum(v['compression_only'] for v in result.values())}))
