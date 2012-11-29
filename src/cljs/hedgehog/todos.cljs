(ns hedgehog.todos
  (:use-macros [hedgehog.macros :only [defo defco]])
  (:require
   [clojure.browser.dom :as dom]
   [clojure.browser.event :as event]
   [reflex.core :as reflex]
   [hedgehog.core :as hedgehog]))

; defo/defe input-event xpath AND THEN when  this changes
; STATE PROPAGATE. defco

;; why do things have to change?
;; 1) core data changes (external)
;; 2) user interaction, ie events! (internal)

;; dom as a CO
;; whenever event happens, something should happen in dom/CO

(defo todos ["buy milk" "eat lunch" "drink milk"])
(defo pending-todo "foo bar")
(defco first-todo (first @todos))
(defco num-todos (count @todos))

(defn add-todo! [todo] (swap! todos conj todo))

(defn todo-element [todo] [:li.todo todo])

(defco title
  (str "Todos" (when-not (zero? @num-todos) (str " (" @num-todos ")"))))

;; traverse this form
;; predicate for @form
;; when hitting @form, make a map that
;; defines which html el (xpath?) binds to that form

(defco body
  [:div#todos
    [:ul
      (map todo-element @todos)
      (when-not (empty? @pending-todo)
        (todo-element @pending-todo))]
    [:input#input
      {:value @pending-todo
       :type "text"
       :autofocus "true"}]
   [:input {:value @pending-todo}]
   [:button "Add"]])

;; TODO: pwn this
(defn input-event
  "too specific"
  [ev]
  (let [val (-> ev .-target .-value)]
    (reset! pending-todo val))) 

(hedgehog/dom-ready! ;; and this
 (fn []
  (hedgehog/init! title body)
  (event/listen (hedgehog/body-el) :input input-event true)))