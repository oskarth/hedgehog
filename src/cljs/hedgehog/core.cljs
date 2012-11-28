(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))

(def document js/document)
(def body (.-body document))

(def dom-state (atom
  {:focus nil
   :selection nil}))

;; dom helpers

(defn get-element-index
  "gets index of element in relation to its siblings"
  [el]
  (let [siblings (js->clj (js/Array.prototype.slice.call
                           (-> el .-parentNode .-childNodes)))]
    (count (take-while (partial not= el) siblings))))
                    
(defn get-element-path
  "get xpath of a dom element"
  [el]
  (let [parent (.-parentNode el)
        tagname (.-tagName el)]
  (cond
   (not= (.-id el) "") (str "id(\"" (.-id el) "\")")
   (= el body) tagname
   :else
     (str (get-element-path parent)
          "/" tagname
          "[" (get-element-index el) "]"))))

(defn get-element
  ""
  [xpath]
  (.iterateNext
    (.evaluate document xpath document nil js/XPathResult.ANY_TYPE nil)))

(defn get-selection
  "returns [start end dir] vector representing element selection"
  [el]
  [(.-selectionStart el) (.-selectionEnd el) (.-selectionDirection el)])

(defn set-selection!
  "restores selection using vector from get-selection"
  [el selection]
  (let [[start end dir] selection]
    (.setSelectionRange el start end dir)))

(defn restore-focus!
  ""
  [{:keys [focus selection] :as curr-dom-state}]
  (when-let [focus-el (get-element focus)]
    (.focus focus-el)
    (when selection
      (dom/log selection)
      (set-selection! focus-el selection))))

(defn set-title! [title]
  (set! (.-title document) title))

;; render funcctions

(defn pre-render!
  ""
  []
  (let [active-el (.-activeElement document)]
    (swap! dom-state assoc
           :focus (get-element-path active-el)
           :selection (get-selection active-el))))

(defn update-dom!
  ""
  [template curr-state]
  (dom/replace-node
   (dom/get-element "content")
   (crate/html
    [:div#content
     (template curr-state)])))

(defn post-render!
  ""
  []
  (let [curr-dom-state @dom-state]
    (restore-focus! curr-dom-state)))

(defn render!
  ""
  [template title curr-state]
  (pre-render!)
  (update-dom! template curr-state)
  (set-title! (title curr-state))
  (post-render!))

(defn dom-init!
  ""
  []
  (dom/insert-at body (dom/element :div {:id "content"}) 0))

(defn make-watcher!
  "creates a watcher for application state"
  [template title state]
  (add-watch state nil
             (fn [k a old-val new-val]
               (js/setTimeout #(render! template title new-val) 0))))

(defn init!
  "inits template with a given state"
  [template title state]
  (dom-init!)
  (make-watcher! template title state)
  (render! template title @state))