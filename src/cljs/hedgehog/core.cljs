(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [clojure.walk :as walk]
            [goog.dom :as gdom]
            [crate.core :as crate]))

(def document js/document)

(def window js/window)

(defn body-el [] (.-body document))

(def !event-map (atom {}))

(def !id (atom -1))

(def !dom-state (atom {:body nil
                       :focus nil
                       :selection nil}))

;; event binding and traversing
;;--------------------------------------------------------------------

;; Taken from Hiccup: http://git.io/65Rf3g
(def re-tag #"([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?")

(defn- eval-to-map? [form]
  (and (fn? form) (map? (form))))

(defn- elem-with-attr? [form]
  (and (vector? form)
       (keyword? (first form))
       (map? (second form))))
       ;(or (map? (second form))
           ;; TODO: make this work
        ;   (eval-to-map? (second form)))))

(defn- bind-val? [form]
  (and (elem-with-attr? form)
       (fn? (:bind-value (second form)))))

(defn- tag-id [[tag & _]]
  "returns tag id or nil of form"
  (nth (re-matches re-tag (name tag)) 2))
  
(defn- bind-value!
  "updates event-map with a unique id and fn,
   and returns the form with updated attribute map"
  [form]
  (let [id (or (tag-id form)
               (:id (second form))
               (swap! !id inc))
        kwid (keyword (str id))
        bind-fn (:bind-value (second form))]
    ;; update event-map
    (swap! !event-map assoc kwid (bind-fn))
    ;; insert id into attr map in form
    (assoc-in (assoc-in form [1 :id] id)
              [1 :bind-value] nil)))

(defn bind-body! [form]
  (reset! !event-map {})
  (walk/postwalk
   (fn [f]
     (if (bind-val? f)
       (bind-value! f)
       f)) form))


;; dom helpers
;;--------------------------------------------------------------------

(defn dom-ready! [f]
  (set! (.-onload window) f))
   
(defn- get-element-index
  "gets index of element in relation to its siblings"
  [el]
  (let [siblings (js->clj (js/Array.prototype.slice.call
                           (-> el .-parentNode .-childNodes)))]
    (count (take-while (partial not= el) siblings))))
                    
(defn- get-element-path
  "get xpath of a dom element"
  [el]
  (let [parent (.-parentNode el)
        tagname (.-tagName el)]
  (cond
   (not= (.-id el) "") (str "id(\"" (.-id el) "\")")
   (= el (body-el)) tagname
   :else
     (str (get-element-path parent)
          "/" tagname
          "[" (get-element-index el) "]"))))

(defn- get-element
  ""
  [xpath]
  (.iterateNext
    (.evaluate document xpath document nil js/XPathResult.ANY_TYPE nil)))

(defn- get-selection
  "returns [start end dir] vector representing element selection"
  [el]
  [(.-selectionStart el) (.-selectionEnd el) (.-selectionDirection el)])

(defn- set-selection!
  "restores selection using vector from get-selection"
  [el selection]
  (let [[start end dir] selection]
    (.setSelectionRange el start end dir)))

;; render
;;--------------------------------------------------------------------

(defn- restore-focus!
  ""
  [{:keys [focus selection] :as curr-dom-state}]
  (when-let [focus-el (get-element focus)]
    (.focus focus-el)
    (when selection
      (set-selection! focus-el selection))))

(defn- set-title! [title]
  (set! (.-title document) title))

(defn- pre-render!
  ""
  []
  (let [active-el (.-activeElement document)]
    (swap! !dom-state assoc
           :focus (get-element-path active-el)
           :selection (get-selection active-el))))

(defn- update-dom!
  ""
  []
  (gdom/removeChildren (body-el))
  (dom/insert-at (body-el)
   (crate/html (:body @!dom-state)) 0))

(defn- post-render!
  ""
  []
  (let [curr-dom-state @!dom-state]
    (restore-focus! curr-dom-state)))

(defn- render!
  ""
  [title body]
  (pre-render!)
  (set-title! title)
  (swap! !dom-state assoc :body (bind-body! body))
  (update-dom!)
  (post-render!))

(defn- listen!
  "sets up top level event handlers"
  []
  (event/listen (body-el) :input
    (fn [ev]
      (let [target (.-target ev)
            id (.getAttribute target "id")
            ev-fn ((keyword id) @!event-map)
            val (.-value target)]
        (when ev-fn (ev-fn val))))
    true))

(def interval-id (atom nil))

(defn pause! []
  (when-let [iid @interval-id]
    (js/clearInterval iid)))

(defn tick!
  [title-fn body-fn]
    (render! (title-fn) (body-fn)))

(defn run!
  [title-fn body-fn]
  (tick! title-fn body-fn)
  (reset! interval-id
          (js/setInterval #(tick! title-fn body-fn) 60)))

(defn init!
  [title-fn body-fn]
  (dom-ready!
   (fn []
     (listen!)
     (run! title-fn body-fn))))
   