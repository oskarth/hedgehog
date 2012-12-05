(ns hedgehog.todos
  (:use-macros [hedgehog.macros :only [defo defco defbody]
                reflex.macros :only [computed-observable]])
  (:require
   [clojure.browser.dom :as dom]
   ;; required so defo macro expansion is included
   [reflex.core :as reflex]
   [hedgehog.core :as hedgehog]))

(defo todos ["buy milk" "eat lunch" "drink milk"])
(defo pending-todo "foo bar")
(defo notification "test notification")
(defco first-todo (first @todos))
(defco num-todos (count @todos))
(defco title
  (str "Todos" (when-not (zero? @num-todos) (str " (" @num-todos ")"))))

(defn add-todo! [todo] (swap! todos conj todo))

(defn update-pending-todo [val]
  (reset! pending-todo val))

(defn todo-element [todo]
  [:li.todo todo
   [:input {:bind-value update-pending-todo}]])

(defn submit-todo []
  (add-todo! @pending-todo)
  (reset! pending-todo "")
  (reset! notification "Nice todo!")
  (js/setTimeout #(reset! notification nil) 5000))

(defco todo-els (map todo-element @todos))

(defco notifications
  (when @notification [:div @notification]))

(defco test [@first-todo @first-todo @first-todo])

(defco body
  [:div#todos
   @notifications
   ;[:ul @todo-els]
   [:input
    {:value @pending-todo
     :bind-value update-pending-todo
     :type "text"
     :autofocus true}]
   [:input {:value @pending-todo}]
   [:button "Add"]])

(hedgehog/init! title body)



(def a (atom 0))
(def b (computed-observable @a))
(def c (computed-observable @a))

(def d (computed-observable [@c @b]))