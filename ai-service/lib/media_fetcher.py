"""
YoZo AI Service — Media Fetcher Module

Cascade-fallback fetchers for videos and images:
  Videos: YouTube → Dailymotion → Khan Academy (curated)
  Images: Unsplash → Pexels → Wikimedia Commons

Each fetcher returns a list of dicts. If the primary source fails,
the next source is tried automatically. If all fail, an empty list
is returned and notes generation continues without that media type.
"""

import logging
import os
from typing import Dict, List

import requests  # type: ignore

logger = logging.getLogger(__name__)

# ───────────────────── API Configuration ─────────────────────

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")

# ═════════════════════════════════════════════════════════════
#  VIDEO FETCHERS
# ═════════════════════════════════════════════════════════════


def fetch_youtube_videos(query: str, max_results: int = 3) -> List[Dict]:
    """Primary video source: YouTube Data API v3."""
    if not YOUTUBE_API_KEY:
        logger.warning("YOUTUBE_API_KEY not set, skipping YouTube.")
        return []

    params = {
        "part": "snippet",
        "q": f"{query} explained for kids education",
        "type": "video",
        "maxResults": max_results,
        "safeSearch": "strict",
        "relevanceLanguage": "en",
        "videoDuration": "medium",  # 4-20 min
        "order": "relevance",
        "key": YOUTUBE_API_KEY,
    }
    try:
        resp = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        return [
            {
                "title": item["snippet"]["title"],
                "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                "channel": item["snippet"]["channelTitle"],
                "source": "youtube",
            }
            for item in resp.json().get("items", [])
        ]
    except Exception as e:
        logger.error(f"YouTube API failed: {e}")
        return []


def fetch_dailymotion_videos(query: str, max_results: int = 3) -> List[Dict]:
    """Fallback #1: Dailymotion (no API key required)."""
    params = {
        "search": f"{query} education",
        "limit": max_results,
        "fields": "id,title,thumbnail_240_url,owner.screenname",
        "family_filter": "true",
        "longer_than": 3,
        "shorter_than": 20,
    }
    try:
        resp = requests.get(
            "https://api.dailymotion.com/videos",
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        return [
            {
                "title": v["title"],
                "url": f"https://www.dailymotion.com/video/{v['id']}",
                "thumbnail": v.get("thumbnail_240_url", ""),
                "channel": v.get("owner.screenname", "Dailymotion"),
                "source": "dailymotion",
            }
            for v in resp.json().get("list", [])
        ]
    except Exception as e:
        logger.error(f"Dailymotion API failed: {e}")
        return []


def fetch_khan_academy_links(query: str) -> List[Dict]:
    """Fallback #2: Curated Khan Academy links (always available)."""
    KHAN_TOPICS = {
        "photosynthesis": "https://www.khanacademy.org/science/biology/photosynthesis-in-plants",
        "fractions": "https://www.khanacademy.org/math/arithmetic/fraction-arithmetic",
        "gravity": "https://www.khanacademy.org/science/physics/centripetal-force-and-gravitation",
        "cells": "https://www.khanacademy.org/science/biology/structure-of-a-cell",
        "atoms": "https://www.khanacademy.org/science/chemistry/atomic-structure-and-properties",
        "ecosystem": "https://www.khanacademy.org/science/biology/ecology",
        "water cycle": "https://www.khanacademy.org/science/biology/ecology/biogeochemical-cycles",
    }
    for keyword, url in KHAN_TOPICS.items():
        if keyword in query.lower():
            return [
                {
                    "title": f"Learn {keyword.title()} — Khan Academy",
                    "url": url,
                    "thumbnail": "",
                    "channel": "Khan Academy",
                    "source": "khan_academy",
                }
            ]
    return []


def fetch_videos_with_fallback(query: str, max_results: int = 3) -> List[Dict]:
    """Cascade: YouTube → Dailymotion → Khan Academy → empty list."""
    fetchers = [
        lambda q, n: fetch_youtube_videos(q, n),
        lambda q, n: fetch_dailymotion_videos(q, n),
        lambda q, _n: fetch_khan_academy_links(q),
    ]
    for fetcher in fetchers:
        results = fetcher(query, max_results)
        if results:
            logger.info(f"Videos fetched: {len(results)} results from {results[0].get('source', '?')}")
            return results
    logger.warning(f"All video sources failed for query: {query}")
    return []


# ═════════════════════════════════════════════════════════════
#  IMAGE FETCHERS
# ═════════════════════════════════════════════════════════════


def fetch_unsplash_images(query: str, max_results: int = 2) -> List[Dict]:
    """Primary image source: Unsplash."""
    if not UNSPLASH_ACCESS_KEY:
        logger.warning("UNSPLASH_ACCESS_KEY not set, skipping Unsplash.")
        return []

    params = {
        "query": query,
        "per_page": max_results,
        "orientation": "landscape",
        "content_filter": "high",
    }
    headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
    try:
        resp = requests.get(
            "https://api.unsplash.com/search/photos",
            params=params,
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        return [
            {
                "url": p["urls"]["regular"],
                "alt": p["alt_description"] or query,
                "credit": f"Photo by {p['user']['name']} on Unsplash",
                "download_url": p["urls"]["small"],
                "source": "unsplash",
            }
            for p in resp.json().get("results", [])
        ]
    except Exception as e:
        logger.error(f"Unsplash failed: {e}")
        return []


def fetch_pexels_images(query: str, max_results: int = 2) -> List[Dict]:
    """Fallback #1: Pexels (free API, key required)."""
    if not PEXELS_API_KEY:
        logger.warning("PEXELS_API_KEY not set, skipping Pexels.")
        return []

    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": f"{query} education",
        "per_page": max_results,
        "orientation": "landscape",
    }
    try:
        resp = requests.get(
            "https://api.pexels.com/v1/search",
            params=params,
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        return [
            {
                "url": p["src"]["large"],
                "alt": p.get("alt", query),
                "credit": f"Photo by {p['photographer']} on Pexels",
                "download_url": p["src"]["medium"],
                "source": "pexels",
            }
            for p in resp.json().get("photos", [])
        ]
    except Exception as e:
        logger.error(f"Pexels failed: {e}")
        return []


def fetch_wikimedia_images(query: str, max_results: int = 2) -> List[Dict]:
    """Fallback #2: Wikimedia Commons (no API key, public domain)."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query} diagram",
        "gsrlimit": max_results,
        "gsrnamespace": 6,  # File namespace
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
    }
    try:
        resp = requests.get(
            "https://commons.wikimedia.org/w/api.php",
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        return [
            {
                "url": p["imageinfo"][0]["url"],
                "alt": p.get("title", query).replace("File:", ""),
                "credit": "Wikimedia Commons (Public Domain)",
                "download_url": p["imageinfo"][0]["url"],
                "source": "wikimedia",
            }
            for p in pages.values()
            if "imageinfo" in p
        ]
    except Exception as e:
        logger.error(f"Wikimedia failed: {e}")
        return []


def fetch_images_with_fallback(query: str, max_results: int = 2) -> List[Dict]:
    """Cascade: Unsplash → Pexels → Wikimedia → empty list."""
    fetchers = [fetch_unsplash_images, fetch_pexels_images, fetch_wikimedia_images]
    for fetcher in fetchers:
        results = fetcher(query, max_results)
        if results:
            logger.info(f"Images fetched: {len(results)} results from {results[0].get('source', '?')}")
            return results
    logger.warning(f"All image sources failed for query: {query}")
    return []
