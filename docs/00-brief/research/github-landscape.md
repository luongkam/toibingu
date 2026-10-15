# Research — GitHub/OSS landscape (2026-10-15)

> HISTORICAL input cho SD. Kiểm tra từ trang GitHub/HF/docs công khai; GitHub API bị chặn nên phần lớn ngày commit cuối không thấy. Sao = số trang hiển thị lúc kiểm tra. **UNVERIFIED** = chưa xác minh.
> Kết luận chính: **không có sản phẩm/dataset "out of the loop" mã nguồn mở nào được duy trì** → khoảng trống sản phẩm.

| Mảng | Repo | Tình trạng | Dùng / học gì | Rủi ro |
|---|---|---|---|---|
| Trend/burst | github.com/online-ml/river | ~6.1k★, BSD-3, active | Rolling mean/var, anomaly/drift → baseline z-score theo cộng đồng × cụm từ, cửa sổ 15' | Thấp |
| | github.com/nmarinsek/burst_detection | 78★, license UNVERIFIED | Kleinberg 2002 — port ~100 dòng, không phụ thuộc | Không duy trì |
| | github.com/twitterdev/Gnip-Trend-Detection | archived 02/2022 | Whitepaper "Trend Detection in Social Data", mô hình Poisson/eta-theta | Chỉ để học |
| Clustering/dedup | github.com/MaartenGr/BERTopic | ~7.9k★, MIT | c-TF-IDF đặt nhãn vụ, `topics_over_time`, `partial_fit` | Python |
| | github.com/scikit-learn-contrib/hdbscan | ~3.2k★, BSD-3 | Soft clustering: bài thuộc vụ với độ tin cậy | Python |
| | github.com/ekzhu/datasketch | ~3.0k★, MIT | MinHash+LSH (Redis) loại repost trước khi embed | Python |
| | github.com/ChenghaoMou/text-dedup | 764★, Apache-2.0 | Tham số MinHash/SimHash tham khảo | — |
| Helpfulness | github.com/twitter/communitynotes | ~1.9k★, Apache-2.0, active | MF "bridging": r̂ = μ + i_user + i_note + f_user·f_note; intercept regularize mạnh hơn ~5× → note chỉ hữu ích khi **cả hai phía** đánh giá tốt (paper: Helpful nếu i_note ≥ 0.40). Dùng cho "Thánh thông não" + chọn lời giải cộng đồng; trục "quan điểm" = fandom vs người ngoài | Nặng (PyTorch); cần ≥~5 rating/note → biên tập viên seed cold start |
| VN NLP | github.com/undertheseanlp/underthesea | ~1.8k★, Apache-2.0 | `text_normalize`, `restore_diacritics`, `word_tokenize` | Python |
| | github.com/trungtv/pyvi | 279★, MIT | Tách từ nhẹ, bỏ/thêm dấu | — |
| | github.com/VinAIResearch/PhoBERT | 809★ | base/large MIT, **base-v2 AGPL-3.0** | **License** |
| | HF bkai-foundation-models/vietnamese-bi-encoder | Apache-2.0 card | Dựa trên PhoBERT-base-v2 (AGPL) | **License** |
| | HF BAAI/bge-m3 | MIT, đa ngữ (VN UNVERIFIED), 8192 tok | Embedding không cần tách từ | Thấp |
| Nguồn | Threads `GET graph.threads.net/v1.0/keyword_search` | Chính thức | `search_type=TOP\|RECENT`, `search_mode=TAG`, since/until, ≤100/lần; **cần app review `threads_keyword_search`** (không có → chỉ thấy bài của chính mình); quota 2.200 query/user/24h; từ khóa nhạy cảm trả rỗng | Phụ thuộc review Meta |
| | github.com/fbsamples/threads_api | 291★ | Mẫu OAuth (publishing, không phải search) | — |
| | github.com/GeneralMills/pytrends | **archived 04/2025** | Không dùng | — |
| | github.com/flack0x/trendspyg | MIT, 57★, active | Chỉ dùng đường RSS realtime theo geo (VN UNVERIFIED); Explore bị 429 sau ~8–10 phiên | Nhỏ, mới |
| Extension | github.com/GoogleChrome/chrome-extensions-samples | 17.8k★, Apache-2.0 | `functional-samples/sample.sidepanel-dictionary` ≈ đúng luồng chuột phải → side panel | — |
| | github.com/wxt-dev/wxt | ~10.6k★, MIT, active | Framework MV3 cross-browser | — |
| | github.com/PlasmoHQ/plasmo | ~13.2k★, tự nhận "alpha" | Không chọn | Duy trì |
| | Cốc Cốc sidePanel API | UNVERIFIED | Cần fallback popup | — |
| Share card | github.com/vercel/satori + next/og | ~14.1k★, MPL-2.0 | JSX → SVG → PNG 1200×630 | Font tiếng Việt (dấu chồng) UNVERIFIED → bundle Be Vietnam Pro, test |
| | github.com/yisibl/resvg-js | ~2.0k★, MPL-2.0 | SVG→PNG ngoài Vercel | — |
| Claim schema | schema.org/ClaimReview | chuẩn | JSON-LD cho 4 nhãn claim → SEO + tương thích fact-check | — |
| | github.com/MuMiN-dataset/mumin-build | MIT, 32★ | Mô hình claim↔post↔article | Cần Twitter API |
| | github.com/eujhwang/meme-cap | 49★, no license | Chỉ dùng đánh giá nội bộ | License |

## Lựa chọn đề xuất (đầu vào SD)
1. Trend: rolling z-score theo cộng đồng × cụm từ (+ Kleinberg port) — đơn giản, giải thích được.
2. Clustering: MinHash dedup → embedding bge-m3 → HDBSCAN; BERTopic chỉ để gợi ý nhãn.
3. Helpfulness: port lõi MF Community Notes (v2).
4. VN NLP: chuẩn hóa dấu tự viết cho pattern matching (MVP); underthesea khi có pipeline Python.
5. Nguồn: Threads keyword_search (nộp app review sớm), Google Trends RSS; pytrends archived.
6. Extension: WXT + mẫu sidepanel-dictionary, fallback popup cho Cốc Cốc.
7. Share card: next/og + font tiếng Việt bundle.
8. Claim: ClaimReview JSON-LD.
