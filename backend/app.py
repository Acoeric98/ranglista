from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from itertools import combinations

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})

DATA_FILE = os.path.join(os.path.dirname(__file__), 'datas.json')
STATS_FILE = os.path.join(os.path.dirname(__file__), 'stats.json')
PAIRINGS_FILE = os.path.join(os.path.dirname(__file__), 'pairings.json')


def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_stats():
    data = load_data()
    players = set()
    for m in data:
        players.add(m["a"])
        players.add(m["b"])

    stats = {
        "totalMatches": len(data),
        "players": {
            p: {
                "matches": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "points": 0,
                "roundsWon": 0,
                "roundsTotal": 0,
                "winrate": 0.0,
                "opponents": []
            } for p in players
        }
    }

    for m in data:
        a, b = m["a"], m["b"]
        sa = m["rounds"].count(1)
        sb = 4 - sa

        for p, s in [(a, sa), (b, sb)]:
            stats["players"][p]["matches"] += 1
            stats["players"][p]["roundsWon"] += s
            stats["players"][p]["roundsTotal"] += 4

        if sa > sb:
            stats["players"][a]["wins"] += 1
            stats["players"][a]["points"] += 3
            stats["players"][b]["losses"] += 1
            result_a, result_b = "win", "loss"
        elif sb > sa:
            stats["players"][b]["wins"] += 1
            stats["players"][b]["points"] += 3
            stats["players"][a]["losses"] += 1
            result_a, result_b = "loss", "win"
        else:
            stats["players"][a]["draws"] += 1
            stats["players"][b]["draws"] += 1
            stats["players"][a]["points"] += 1
            stats["players"][b]["points"] += 1
            result_a = result_b = "draw"

        stats["players"][a]["opponents"].append({
            "name": b,
            "score": f"{sa}-{sb}",
            "result": result_a
        })
        stats["players"][b]["opponents"].append({
            "name": a,
            "score": f"{sb}-{sa}",
            "result": result_b
        })

    for p, s in stats["players"].items():
        if s["roundsTotal"] > 0:
            s["winrate"] = round(s["roundsWon"] / s["roundsTotal"] * 100, 1)

    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)


def save_data(data):
    generate_stats()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_pairings():
    if not os.path.exists(PAIRINGS_FILE):
        return []
    with open(PAIRINGS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_pairings(data):
    with open(PAIRINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/api/matches', methods=['GET'])
def get_matches():
    return jsonify(load_data())


@app.route('/api/match', methods=['POST'])
def add_match():
    match = request.json
    if not match or not all(k in match for k in ['a', 'b', 'rounds']):
        return jsonify({'error': 'Invalid match format'}), 400
    if len(match['rounds']) != 4:
        return jsonify({'error': 'Exactly 4 rounds required'}), 400
    data = load_data()
    data.append(match)
    save_data(data)
    generate_stats()
    return jsonify({'message': 'Match saved'}), 201


@app.route('/api/pairings', methods=['GET'])
def get_pairings():
    return jsonify(load_pairings())


@app.route('/api/pairings', methods=['POST'])
def set_pairings():
    pairings = request.json
    if not isinstance(pairings, list):
        return jsonify({'error': 'Invalid format'}), 400
    save_pairings(pairings)
    return jsonify({'message': 'Pairings saved'}), 201


@app.route('/api/stats', methods=['GET'])
def get_stats():
    data = load_data()

    # Összes játékos kigyűjtése
    players = set()
    for m in data:
        players.add(m["a"])
        players.add(m["b"])

    stats = {
        "totalMatches": len(data),
        "players": {p: {
            "matches": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "points": 0,
            "roundsWon": 0,
            "roundsTotal": 0,
            "winrate": 0.0
        } for p in players}
    }

    for m in data:
        a, b = m["a"], m["b"]
        sa = m["rounds"].count(1)
        sb = 4 - sa

        stats["players"][a]["matches"] += 1
        stats["players"][b]["matches"] += 1
        stats["players"][a]["roundsWon"] += sa
        stats["players"][b]["roundsWon"] += sb
        stats["players"][a]["roundsTotal"] += 4
        stats["players"][b]["roundsTotal"] += 4

        if sa > sb:
            stats["players"][a]["wins"] += 1
            stats["players"][a]["points"] += 3
            stats["players"][b]["losses"] += 1
        elif sb > sa:
            stats["players"][b]["wins"] += 1
            stats["players"][b]["points"] += 3
            stats["players"][a]["losses"] += 1
        else:
            stats["players"][a]["draws"] += 1
            stats["players"][b]["draws"] += 1
            stats["players"][a]["points"] += 1
            stats["players"][b]["points"] += 1

    # winrate kiszámítása
    for p, s in stats["players"].items():
        if s["roundsTotal"] > 0:
            s["winrate"] = round(s["roundsWon"] / s["roundsTotal"] * 100, 1)

    return jsonify(stats)

@app.route('/api/generate-pairings', methods=['GET'])
def generate_pairings():
    data = load_data()

    players = set()
    for m in data:
        players.add(m["a"])
        players.add(m["b"])
    players = sorted(players)

    already_played = set(tuple(sorted([m["a"], m["b"]])) for m in data)

    all_possible = list(combinations(players, 2))
    not_played = [pair for pair in all_possible if pair not in already_played]

    # Greedy algoritmus: max. 7 pár, mindenki csak egyszer
    used = set()
    valid_pairs = []
    for a, b in not_played:
        if a not in used and b not in used:
            valid_pairs.append([a, b])
            used.add(a)
            used.add(b)
            if len(valid_pairs) == 7:
                break

    if not valid_pairs:
        return jsonify({"error": "Nem lehet új érvényes párosítást generálni."}), 400

    save_pairings(valid_pairs)
    return jsonify(valid_pairs), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
