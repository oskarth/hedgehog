(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))


(def document js/document)
(def body (.-body document))

;; TODO: name make sense?
(def dom-state (atom
  {:focus nil
   :selection nil}))

;; selectors

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
  [xpath]
  (.iterateNext
    (.evaluate document xpath document nil js/XPathResult.ANY_TYPE nil)))

;; dom ranges/selections

(defn get-selection
  "returns [start end dir] vector representing element selection"
  [el]
  [(.-selectionStart el)
   (.-selectionEnd el)
   (.-selectionDirection el)])

(defn set-selection!
  "restores selection using vector from get-selection"
  [el selection]
  (let [[start end dir] selection]
    (.setSelectionRange el start end dir)))


;; core

(defn restore-focus!
  [{:keys [focus selection] :as curr-dom-state}]
  (when-let [focus-el (get-element focus)]
    (.focus focus-el)
    (when selection
      (dom/log selection)
      (set-selection! focus-el selection))))

(defn set-title! [title]
  (set! (.-title document) title))

(defn render! [template title curr-state]
  (let [curr-dom-state @dom-state]
    ;; replace root 'content' node with new template
    (dom/replace-node
     (dom/get-element "content")
     (crate/html
      [:div#content
       (template curr-state)]))
    ;; replace title using title fn defined init
    (set-title! (title curr-state))
    ;; restore focus to previously focused element
    (restore-focus! curr-dom-state)))

(defn init! [template title state]
  (dom/insert-at
    body
    (dom/element :div {:id "content"})
    0)
  (add-watch state nil
    (fn [k a old-val new-val]
      (render! template title new-val)))
  (render! template title @state))

;; event handlers?

(defn focus-event!
  "saves focused dom element in dom-state atom"
  [ev]
  (let [target (.-target ev)]
    (swap! dom-state assoc
      :focus (get-element-path target)
      :selection (get-selection target))))

(defn blur-event!
  "remove previously focused dom element from dom-state atom"
  [ev]
  (swap! dom-state assoc
    :focus nil
    :selection nil))

(event/listen body :focus focus-event! true)
(event/listen body :blur blur-event! true)